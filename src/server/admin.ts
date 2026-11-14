import type { Env } from './env';
import { verifyAccess } from './access';
import { participationTypes } from '../data/home';

/**
 * 관리 경로(/admin*). 모든 요청은 Cloudflare Access JWT 검증을 통과해야 한다.
 *  GET    /admin                         관리 화면(정적 자산)
 *  GET    /admin/api/applications        신청 목록(JSON)
 *  PATCH  /admin/api/applications/:id    상태·담당자·메모 변경
 *  DELETE /admin/api/applications/:id    신청 삭제(철회 요청 처리)
 *  GET    /admin/export.csv              CSV 내보내기
 */

export const STATUSES = ['new', 'assigned', 'contacted', 'closed'] as const;
export const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  new: '신규',
  assigned: '담당 지정',
  contacted: '연락 완료',
  closed: '종료',
};
const LIST_LIMIT = 2000;

interface Row {
  id: string; created_at: string; updated_at: string; name: string; email: string;
  affiliation: string | null; types: string; message: string | null; privacy_consent_at: string;
  privacy_version: string; news_opt_in: number; status: string; assignee: string | null;
  admin_note: string | null; admin_updated_at: string | null; admin_updated_by: string | null;
}

export async function handleAdmin(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '') || '/';

  const auth = await verifyAccess(request, env);
  if (!auth.ok) {
    console.warn('admin denied', auth.reason, path);
    return auth.status === 503
      ? textPage(503, '관리 화면 접근 설정이 필요합니다', 'Cloudflare Access 설정(ACCESS_TEAM_DOMAIN, ACCESS_AUD)을 확인해 주세요.')
      : textPage(401, '로그인이 필요합니다', '허용된 계정으로 Cloudflare Access 로그인을 거쳐 접속해 주세요.');
  }

  // 상태를 바꾸는 요청은 같은 출처에서만(Access 쿠키를 이용한 다른 사이트 요청 방지)
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('Origin');
    if (!origin || origin !== url.origin) return json(403, { ok: false, message: '허용되지 않은 요청입니다.' });
  }

  if (path === '/admin' || path === '/admin.html') {
    if (request.method !== 'GET') return methodNotAllowed('GET');
    const res = await env.ASSETS.fetch(new Request(new URL('/admin', url), request));
    const out = new Response(res.body, res);
    out.headers.set('Cache-Control', 'no-store');
    out.headers.set('X-Robots-Tag', 'noindex');
    return out;
  }

  if (path === '/admin/api/me') return json(200, { ok: true, email: auth.email });

  if (path === '/admin/api/applications') {
    if (request.method !== 'GET') return methodNotAllowed('GET');
    const { results } = await env.DB.prepare(`SELECT * FROM applications ORDER BY created_at DESC LIMIT ?`)
      .bind(LIST_LIMIT)
      .all<Row>();
    return json(200, { ok: true, items: results.map(toItem), limit: LIST_LIMIT });
  }

  const m = /^\/admin\/api\/applications\/([0-9a-f-]{36})$/.exec(path);
  if (m) {
    const id = m[1];
    if (request.method === 'PATCH') return updateApplication(request, env, id, auth.email);
    if (request.method === 'DELETE') {
      const r = await env.DB.prepare('DELETE FROM applications WHERE id = ?').bind(id).run();
      if (!r.meta.changes) return json(404, { ok: false, message: '이미 삭제되었거나 없는 신청입니다.' });
      console.log('admin delete', { id, by: auth.email });
      return json(200, { ok: true });
    }
    return methodNotAllowed('PATCH, DELETE');
  }

  if (path === '/admin/export.csv') {
    if (request.method !== 'GET') return methodNotAllowed('GET');
    const { results } = await env.DB.prepare('SELECT * FROM applications ORDER BY created_at DESC').all<Row>();
    console.log('admin export', { rows: results.length, by: auth.email });
    const date = new Date().toISOString().slice(0, 10);
    return new Response('﻿' + toCsv(results), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="itschool-applications-${date}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  return json(404, { ok: false, message: '없는 경로입니다.' });
}

async function updateApplication(request: Request, env: Env, id: string, by: string): Promise<Response> {
  let body: { status?: unknown; assignee?: unknown; admin_note?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, message: 'JSON 형식이 아닙니다.' });
  }
  const errors: Record<string, string> = {};
  const status = body.status;
  if (typeof status !== 'string' || !(STATUSES as readonly string[]).includes(status)) errors.status = '상태 값이 올바르지 않습니다.';
  const assignee = typeof body.assignee === 'string' ? body.assignee.trim() : '';
  if (assignee.length > 50) errors.assignee = '50자 이내로 입력해 주세요.';
  const note = typeof body.admin_note === 'string' ? body.admin_note.trim() : '';
  if (note.length > 2000) errors.admin_note = '2000자 이내로 입력해 주세요.';
  if (Object.keys(errors).length) return json(400, { ok: false, errors, message: '입력 내용을 확인해 주세요.' });

  const now = new Date().toISOString();
  const r = await env.DB.prepare(
    `UPDATE applications SET status=?, assignee=?, admin_note=?, admin_updated_at=?, admin_updated_by=? WHERE id=?`,
  )
    .bind(status, assignee || null, note || null, now, by, id)
    .run();
  if (!r.meta.changes) return json(404, { ok: false, message: '없는 신청입니다.' });
  const row = await env.DB.prepare('SELECT * FROM applications WHERE id = ?').bind(id).first<Row>();
  return json(200, { ok: true, item: row ? toItem(row) : null });
}

function toItem(r: Row) {
  let types: string[] = [];
  try { types = JSON.parse(r.types); } catch { /* 손상된 값은 빈 목록 */ }
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at, name: r.name, email: r.email,
    affiliation: r.affiliation ?? '', types, message: r.message ?? '', newsOptIn: r.news_opt_in === 1,
    status: r.status, assignee: r.assignee ?? '', note: r.admin_note ?? '',
    adminUpdatedAt: r.admin_updated_at, adminUpdatedBy: r.admin_updated_by,
    privacyConsentAt: r.privacy_consent_at, privacyVersion: r.privacy_version,
  };
}

const typeLabel = (v: string) => participationTypes.find((t) => t.value === v)?.label ?? v;

export function toCsv(rows: Row[]): string {
  const head = ['신청일시', '수정일시', '이름/활동명', '이메일', '소속·활동분야', '참여 방식', '남긴 이야기', '소식 수신',
    '상태', '담당자', '메모', '관리 수정일시', '관리 수정자', '동의 일시', '처리방침 버전', 'ID'];
  const lines = rows.map((r) => {
    let types: string[] = [];
    try { types = JSON.parse(r.types); } catch { /* noop */ }
    return [r.created_at, r.updated_at, r.name, r.email, r.affiliation ?? '', types.map(typeLabel).join(', '),
      r.message ?? '', r.news_opt_in ? '동의' : '미동의', STATUS_LABEL[r.status as keyof typeof STATUS_LABEL] ?? r.status,
      r.assignee ?? '', r.admin_note ?? '', r.admin_updated_at ?? '', r.admin_updated_by ?? '',
      r.privacy_consent_at, r.privacy_version, r.id];
  });
  return [head, ...lines].map((cols) => cols.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** CSV 셀: 따옴표 처리 + 스프레드시트 수식 실행 방지(=,+,-,@로 시작하면 ' 붙임) */
export function csvCell(v: string): string {
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function methodNotAllowed(allow: string): Response {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: allow } });
}

function textPage(status: number, title: string, body: string): Response {
  return new Response(
    `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${title}</title>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem;line-height:1.6">
<h1 style="font-size:1.5rem">${title}</h1><p>${body}</p></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
}
