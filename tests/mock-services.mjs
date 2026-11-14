// 로컬 테스트용 외부 서비스 대역.
// - POST /siteverify               : Turnstile. 토큰 값에 따라 응답을 바꾼다.
// - POST /emails, GET /emails       : Resend. 받은 메일을 기록·조회.
// - GET  /cdn-cgi/access/certs      : Cloudflare Access JWKS(테스트 키)
// - GET  /test/sign?email=&aud=&exp=&iss=&badsig= : 테스트 키로 서명한 Access JWT 발급(테스트 전용)
import { createServer } from 'node:http';
import { generateKeyPairSync, createSign } from 'node:crypto';

const port = Number(process.argv[2] ?? 8799);
const ISSUER = `http://127.0.0.1:${port}`;
const KID = 'test-kid-1';
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const other = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey; // 서명 위조용
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KID, alg: 'RS256', use: 'sig' };

const b64u = (buf) => Buffer.from(buf).toString('base64url');
function sign({ email, aud, exp, iss, badsig }) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(JSON.stringify({ alg: 'RS256', kid: KID, typ: 'JWT' }));
  const payload = b64u(JSON.stringify({ email, aud: [aud], iss: iss ?? ISSUER, iat: now, nbf: now, exp: now + Number(exp ?? 600) }));
  const s = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(badsig ? other : privateKey);
  return `${header}.${payload}.${b64u(s)}`;
}

const mails = [];
createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString();
  const url = new URL(req.url, ISSUER);
  const send = (obj) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };

  if (url.pathname === '/emails' && req.method === 'POST') { mails.push(JSON.parse(body)); return send({ id: `m${mails.length}` }); }
  if (url.pathname === '/emails') return send(mails);
  if (url.pathname === '/cdn-cgi/access/certs') return send({ keys: [jwk] });
  if (url.pathname === '/test/sign') {
    const q = Object.fromEntries(url.searchParams);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    return res.end(sign({ ...q, badsig: q.badsig === '1' }));
  }

  const token = /name="response"\r\n\r\n([^\r]*)/.exec(body)?.[1] ?? new URLSearchParams(body).get('response');
  send({
    'pass-token': { success: true, action: 'apply', hostname: 'localhost' },
    'other-action': { success: true, action: 'login', hostname: 'localhost' },
  }[token] ?? { success: false, 'error-codes': ['invalid-input-response'] });
}).listen(port, '127.0.0.1');
