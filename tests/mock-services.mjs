// 로컬 테스트용 외부 서비스 대역.
// - POST /siteverify : Turnstile. 토큰 값에 따라 응답을 바꾼다.
// - POST /emails     : Resend. 받은 메일을 기록한다. GET /emails 로 조회.
import { createServer } from 'node:http';

const port = Number(process.argv[2] ?? 8799);
const mails = [];
createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString();
  const send = (obj) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };

  if (req.url === '/emails' && req.method === 'POST') { mails.push(JSON.parse(body)); return send({ id: `m${mails.length}` }); }
  if (req.url === '/emails') return send(mails);

  const token = /name="response"\r\n\r\n([^\r]*)/.exec(body)?.[1] ?? new URLSearchParams(body).get('response');
  send({
    'pass-token': { success: true, action: 'apply', hostname: 'localhost' },
    'other-action': { success: true, action: 'login', hostname: 'localhost' },
  }[token] ?? { success: false, 'error-codes': ['invalid-input-response'] });
}).listen(port, '127.0.0.1');
