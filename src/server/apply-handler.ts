import type { Env } from './env';
import { readApplyInput, validateApply, type ApplyErrors, type ApplyResponse } from '../lib/apply';
import { notifyMail, receiptMail, sendMail } from './mail';
import { site } from '../site';

export const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 };
const DEDUPE_MS = 24 * 60 * 60 * 1000;
const MAX_BODY = 32 * 1024;

type Waiter = { waitUntil(p: Promise<unknown>): void };

export async function handleApply(request: Request, env: Env, ctx: Waiter): Promise<Response> {
  const wantsJson = (request.headers.get('Accept') ?? '').includes('application/json');
  const reply = (status: number, body: ApplyResponse) =>
    wantsJson ? json(status, body) : htmlFallback(status, body, env);

  // 같은 출처에서 온 요청만 받는다(다른 사이트에서의 자동 제출 방지)
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return reply(403, { ok: false, message: '허용되지 않은 요청입니다.' });
  }
  const len = Number(request.headers.get('Content-Length') ?? 0);
  if (len > MAX_BODY) return reply(413, { ok: false, message: '입력 내용이 너무 깁니다.' });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply(400, { ok: false, message: '요청 형식이 올바르지 않습니다.' });
  }
  const input = readApplyInput(form);

  // honeypot: 채워져 있으면 저장하지 않고 성공처럼 응답한다
  if (input.website) return reply(201, { ok: true });

  const errors: ApplyErrors = validateApply(input);
  if (Object.keys(errors).length) return reply(400, { ok: false, errors, message: '입력 내용을 확인해 주세요.' });

  const ip = request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';
  if (env.TURNSTILE_SECRET) {
    const token = form.get('cf-turnstile-response');
    if (typeof token !== 'string' || !(await verifyTurnstile(env.TURNSTILE_SECRET, token, ip))) {
      return reply(403, { ok: false, message: '자동 입력 방지 확인에 실패했습니다. 새로고침 후 다시 시도해 주세요.' });
    }
  }

  const now = Date.now();
  const rateKey = await sha256(`${env.RATE_SALT ?? 'dev-salt'}:${ip}`);
  const since = now - RATE_LIMIT.windowMs;
  const hits = await env.DB.prepare('SELECT COUNT(*) AS n FROM rate_hits WHERE key = ? AND at > ?')
    .bind(rateKey, since)
    .first<{ n: number }>();
  if ((hits?.n ?? 0) >= RATE_LIMIT.max) {
    return reply(429, { ok: false, message: '짧은 시간에 여러 번 보내셨습니다. 잠시 후 다시 시도해 주세요.' });
  }

  const nowIso = new Date(now).toISOString();
  const recent = await env.DB.prepare(
    'SELECT id FROM applications WHERE email = ? AND created_at > ? ORDER BY created_at DESC LIMIT 1',
  )
    .bind(input.email, new Date(now - DEDUPE_MS).toISOString())
    .first<{ id: string }>();

  const id = recent?.id ?? crypto.randomUUID();
  const values = [
    input.name,
    input.affiliation || null,
    JSON.stringify(input.types),
    input.message || null,
    nowIso,
    site.privacy.version,
    input.newsOptIn ? 1 : 0,
  ];
  const write = recent
    ? env.DB.prepare(
        `UPDATE applications SET name=?, affiliation=?, types=?, message=?, privacy_consent_at=?, privacy_version=?,
         news_opt_in=?, updated_at=? WHERE id=?`,
      ).bind(...values, nowIso, id)
    : env.DB.prepare(
        `INSERT INTO applications (name, affiliation, types, message, privacy_consent_at, privacy_version, news_opt_in,
         id, email, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(...values, id, input.email, nowIso, nowIso);

  await env.DB.batch([
    write,
    env.DB.prepare('INSERT INTO rate_hits (key, at) VALUES (?, ?)').bind(rateKey, now),
    env.DB.prepare('DELETE FROM rate_hits WHERE at < ?').bind(since),
  ]);

  ctx.waitUntil(
    Promise.all([
      sendMail(env, notifyMail(env, input, id, Boolean(recent))),
      recent ? Promise.resolve('skipped') : sendMail(env, receiptMail(env, input)),
    ]),
  );

  return reply(201, { ok: true });
}

function json(status: number, body: ApplyResponse): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/** JS 없이 제출한 경우: 성공은 /thanks로, 실패는 짧은 안내 페이지 */
function htmlFallback(status: number, body: ApplyResponse, env: Env): Response {
  if (body.ok) return new Response(null, { status: 303, headers: { Location: '/thanks' } });
  const items = body.errors ? Object.values(body.errors).map((m) => `<li>${escapeHtml(m ?? '')}</li>`).join('') : '';
  const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>신청을 접수하지 못했습니다 | ${escapeHtml(site.org)}</title>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem;line-height:1.6">
<h1 style="font-size:1.5rem">신청을 접수하지 못했습니다</h1><p>${escapeHtml(body.message ?? '')}</p>${items ? `<ul>${items}</ul>` : ''}
<p><a href="${escapeHtml((env.SITE_URL ?? '') + '/#apply')}">신청 화면으로 돌아가기</a></p></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function verifyTurnstile(secret: string, token: string, ip: string): Promise<boolean> {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
