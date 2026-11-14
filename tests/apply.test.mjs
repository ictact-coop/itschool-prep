// 신청 API 통합 테스트. `npm run test:api:local`이 로컬 D1 + wrangler pages dev를 띄운 뒤 실행한다.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:8788';
const run = Date.now().toString(36);
let ipSeq = 0;
const nextIp = () => `10.9.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;

function form(fields) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const x of [].concat(v)) f.append(k, x);
  return f;
}
const valid = (email) => ({
  name: '홍길동', email, affiliation: '시민단체', types: ['tech', 'education'],
  message: '함께하고 싶습니다', privacyConsent: 'on', newsOptIn: 'on',
  'cf-turnstile-response': 'pass-token',
});
async function post(fields, { json = true, ip = nextIp(), headers = {} } = {}) {
  const res = await fetch(`${BASE}/api/apply`, {
    method: 'POST', body: form(fields), redirect: 'manual',
    headers: { ...(json ? { Accept: 'application/json' } : {}), 'CF-Connecting-IP': ip, ...headers },
  });
  const body = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text();
  return { res, body };
}
function db(sql) {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'itschool-prep', '--local', '--json', '--command', sql], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
  });
  return JSON.parse(out)[0].results;
}

test('정상 신청 → 201, 저장, 이메일 소문자', async () => {
  const email = `Ok-${run}@Example.com`;
  const { res, body } = await post(valid(email));
  assert.equal(res.status, 201);
  assert.deepEqual(body, { ok: true });
  const rows = db(`SELECT * FROM applications WHERE email='${email.toLowerCase()}'`);
  assert.equal(rows.length, 1);
  assert.deepEqual(JSON.parse(rows[0].types), ['tech', 'education']);
  assert.equal(rows[0].news_opt_in, 1);
  assert.equal(rows[0].status, 'new');
  assert.ok(rows[0].privacy_version);
});

test('필수 누락 → 400, 필드별 오류', async () => {
  const { res, body } = await post({ name: '', email: 'x', types: [], website: '' });
  assert.equal(res.status, 400);
  assert.deepEqual(Object.keys(body.errors).sort(), ['email', 'name', 'privacyConsent', 'types']);
});

test('알 수 없는 유형만 보내면 유형 오류', async () => {
  const { res, body } = await post({ ...valid(`t-${run}@ex.com`), types: ['admin'] });
  assert.equal(res.status, 400);
  assert.ok(body.errors.types);
});

test('honeypot 채움 → 201이지만 저장 안 함', async () => {
  const email = `bot-${run}@ex.com`;
  const { res } = await post({ ...valid(email), website: 'http://spam' });
  assert.equal(res.status, 201);
  assert.equal(db(`SELECT id FROM applications WHERE email='${email}'`).length, 0);
});

test('24시간 내 같은 이메일 재제출 → 한 건으로 갱신', async () => {
  const email = `dup-${run}@ex.com`;
  await post(valid(email));
  const { res } = await post({ ...valid(email), types: ['sponsor'], message: '수정' });
  assert.equal(res.status, 201);
  const rows = db(`SELECT types, message FROM applications WHERE email='${email}'`);
  assert.equal(rows.length, 1);
  assert.deepEqual(JSON.parse(rows[0].types), ['sponsor']);
  assert.equal(rows[0].message, '수정');
});

test('다른 출처(Origin) → 403', async () => {
  const { res } = await post(valid(`o-${run}@ex.com`), { headers: { Origin: 'https://evil.example' } });
  assert.equal(res.status, 403);
});

test('GET → 405', async () => {
  const res = await fetch(`${BASE}/api/apply`);
  assert.equal(res.status, 405);
});

test('JS 없는 제출: 성공 303 /thanks, 실패 400 HTML', async () => {
  const ok = await post(valid(`nojs-${run}@ex.com`), { json: false });
  assert.equal(ok.res.status, 303);
  assert.equal(ok.res.headers.get('location'), '/thanks');
  const bad = await post({ name: '<b>x</b>' }, { json: false });
  assert.equal(bad.res.status, 400);
  assert.match(bad.body, /신청을 접수하지 못했습니다/);
});

test('같은 IP 10분 내 6번째 → 429', async () => {
  const ip = `10.250.${run.length}.1`;
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await post(valid(`rl${i}-${run}@ex.com`), { ip })).res.status);
  assert.deepEqual(codes, [201, 201, 201, 201, 201, 429]);
});

test('Turnstile 토큰 없음 → 403, 저장 안 함', async () => {
  const email = `ts-none-${run}@ex.com`;
  const { 'cf-turnstile-response': _, ...noToken } = valid(email);
  const { res, body } = await post(noToken);
  assert.equal(res.status, 403);
  assert.match(body.message, /자동 입력 방지/);
  assert.equal(db(`SELECT id FROM applications WHERE email='${email}'`).length, 0);
});

test('Turnstile 검증 실패 토큰 → 403', async () => {
  const { res } = await post({ ...valid(`ts-bad-${run}@ex.com`), 'cf-turnstile-response': 'forged' });
  assert.equal(res.status, 403);
});

test('Turnstile 다른 action 토큰 → 403', async () => {
  const { res } = await post({ ...valid(`ts-act-${run}@ex.com`), 'cf-turnstile-response': 'other-action' });
  assert.equal(res.status, 403);
});

test('메일: 담당자 알림 + 신청자 접수 확인, 회신 주소는 공용 주소', async () => {
  const email = `mail-${run}@ex.com`;
  await post(valid(email));
  let mails = [];
  for (let i = 0; i < 20 && mails.length < 2; i++) {
    await new Promise((r) => setTimeout(r, 200));
    mails = (await (await fetch('http://127.0.0.1:8799/emails')).json()).filter((m) => JSON.stringify(m).includes(email));
  }
  const notify = mails.find((m) => m.to.includes('staff1@example.org'));
  const receipt = mails.find((m) => m.to.includes(email));
  assert.ok(notify, '담당자 알림');
  assert.deepEqual(notify.to, ['staff1@example.org', 'staff2@example.org']);
  assert.equal(notify.reply_to, email);
  assert.ok(receipt, '접수 확인');
  assert.equal(receipt.reply_to, 'itschool@ictact.kr');
  assert.ok(!JSON.stringify(receipt).includes('staff1@example.org'), '신청자 메일에 담당자 주소 없음');
  assert.equal(receipt.from, 'IT학교 설립준비위원회 <itschool@ictact.kr>');
});
