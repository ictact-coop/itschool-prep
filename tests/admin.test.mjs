// 관리 화면(/admin) 통합 테스트. Access JWT는 가짜 서비스(tests/mock-services.mjs)의 테스트 키로 서명한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:8788';
const MOCK = 'http://127.0.0.1:8799';
const run = Date.now().toString(36);

const jwt = async (q = {}) =>
  (await fetch(`${MOCK}/test/sign?${new URLSearchParams({ email: 'Staff@Example.org', aud: 'test-aud', ...q })}`)).text();
const ok = await jwt();

async function admin(path, { token = ok, method = 'GET', body, origin = BASE, cookie = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (token) cookie ? (headers.Cookie = `CF_Authorization=${token}`) : (headers['Cf-Access-Jwt-Assertion'] = token);
  if (body) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && origin) headers.Origin = origin;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const ct = res.headers.get('content-type') ?? '';
  return { res, body: ct.includes('json') ? await res.json() : await res.text() };
}

async function apply(fields) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const x of [].concat(v)) f.append(k, x);
  const res = await fetch(`${BASE}/api/apply`, {
    method: 'POST', body: f, headers: { Accept: 'application/json', 'CF-Connecting-IP': `10.77.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` },
  });
  assert.equal(res.status, 201);
}
const base = (email, extra = {}) => ({
  name: '관리테스트', email, types: ['committee', 'sponsor'], privacyConsent: 'on', 'cf-turnstile-response': 'pass-token', ...extra,
});
const find = async (email) => (await admin('/admin/api/applications')).body.items.find((i) => i.email === email);

test('토큰 없이 /admin, /admin.html, API 모두 401', async () => {
  for (const p of ['/admin', '/admin.html', '/admin/api/applications', '/admin/export.csv']) {
    const { res } = await admin(p, { token: null });
    assert.equal(res.status, 401, p);
  }
});

test('잘못된 JWT 거부: 서명 위조, 다른 aud, 만료, 다른 iss', async () => {
  for (const q of [{ badsig: '1' }, { aud: 'other-aud' }, { exp: '-120' }, { iss: 'https://evil.cloudflareaccess.com' }]) {
    const { res } = await admin('/admin/api/applications', { token: await jwt(q) });
    assert.equal(res.status, 401, JSON.stringify(q));
  }
});

test('정상 JWT: 관리 화면 HTML(no-store, noindex), 쿠키로도 접근', async () => {
  const { res, body } = await admin('/admin');
  assert.equal(res.status, 200);
  assert.match(body, /신청 관리/);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.equal(res.headers.get('x-robots-tag'), 'noindex');
  const me = await admin('/admin/api/me', { cookie: true });
  assert.equal(me.body.email, 'staff@example.org');
});

test('목록·상태 변경·감사 기록', async () => {
  const email = `adm-${run}@ex.com`;
  await apply(base(email, { message: '여러 줄\n메시지' }));
  const it = await find(email);
  assert.ok(it);
  assert.deepEqual(it.types, ['committee', 'sponsor']);
  assert.equal(it.status, 'new');

  const { res, body } = await admin(`/admin/api/applications/${it.id}`, {
    method: 'PATCH', body: { status: 'assigned', assignee: '김담당', admin_note: '첫 연락 예정' },
  });
  assert.equal(res.status, 200);
  assert.equal(body.item.status, 'assigned');
  assert.equal(body.item.assignee, '김담당');
  assert.equal(body.item.adminUpdatedBy, 'staff@example.org');
  assert.ok(body.item.adminUpdatedAt);
});

test('변경 검증: 잘못된 상태 400, Origin 없음 403, 다른 Origin 403, 없는 ID 404', async () => {
  const it = await find(`adm-${run}@ex.com`);
  assert.equal((await admin(`/admin/api/applications/${it.id}`, { method: 'PATCH', body: { status: 'done' } })).res.status, 400);
  assert.equal((await admin(`/admin/api/applications/${it.id}`, { method: 'PATCH', body: { status: 'closed' }, origin: null })).res.status, 403);
  assert.equal((await admin(`/admin/api/applications/${it.id}`, { method: 'PATCH', body: { status: 'closed' }, origin: 'https://evil.example' })).res.status, 403);
  assert.equal((await admin('/admin/api/applications/00000000-0000-0000-0000-000000000000', { method: 'PATCH', body: { status: 'closed' } })).res.status, 404);
});

test('CSV: BOM·한글 헤더·수식 실행 방지·여러 줄 셀', async () => {
  const email = `csv-${run}@ex.com`;
  await apply(base(email, { name: '=HYPERLINK("http://evil")' }));
  const res = await fetch(`${BASE}/admin/export.csv`, { headers: { 'Cf-Access-Jwt-Assertion': ok } });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-disposition'), /attachment; filename="itschool-applications-\d{4}-\d{2}-\d{2}\.csv"/);
  const buf = new Uint8Array(await res.arrayBuffer());
  assert.deepEqual([...buf.slice(0, 3)], [0xef, 0xbb, 0xbf]);
  const text = new TextDecoder('utf-8', { ignoreBOM: true }).decode(buf);
  assert.match(text, /^﻿신청일시,수정일시,이름\/활동명,이메일/);
  assert.ok(text.includes(`"'=HYPERLINK(""http://evil"")"`), '수식 앞에 작은따옴표');
  assert.ok(text.includes('"여러 줄\n메시지"'), '줄바꿈 셀은 따옴표');
  assert.ok(text.includes('추진위원, 후원'));
});

test('삭제: 200 후 목록에서 사라지고 다시 삭제하면 404', async () => {
  const email = `del-${run}@ex.com`;
  await apply(base(email));
  const it = await find(email);
  assert.equal((await admin(`/admin/api/applications/${it.id}`, { method: 'DELETE' })).res.status, 200);
  assert.equal(await find(email), undefined);
  assert.equal((await admin(`/admin/api/applications/${it.id}`, { method: 'DELETE' })).res.status, 404);
});
