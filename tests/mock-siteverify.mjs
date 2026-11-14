// 로컬 테스트용 Turnstile siteverify 대역. 토큰 값에 따라 응답을 바꾼다.
import { createServer } from 'node:http';

const port = Number(process.argv[2] ?? 8799);
createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = Buffer.concat(chunks).toString();
  const token = /name="response"\r\n\r\n([^\r]*)/.exec(body)?.[1] ?? new URLSearchParams(body).get('response');
  const reply = {
    'pass-token': { success: true, action: 'apply', hostname: 'localhost' },
    'other-action': { success: true, action: 'login', hostname: 'localhost' },
  }[token] ?? { success: false, 'error-codes': ['invalid-input-response'] };
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(reply));
}).listen(port, '127.0.0.1');
