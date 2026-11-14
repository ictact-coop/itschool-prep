import type { Env } from './env';

/**
 * Cloudflare Access JWT 검증.
 * Access가 /admin 앞에서 로그인시키고 `Cf-Access-Jwt-Assertion` 헤더를 붙인다.
 * Worker에서도 서명·aud·iss·만료를 다시 확인해, Access가 빠진 경로(예: 설정 누락)로 들어와도 막는다.
 */

export type AccessResult =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 503; reason: string };

interface Jwk { kid: string; kty: string; n: string; e: string; alg?: string }
let jwksCache: { url: string; at: number; keys: Jwk[] } | null = null;
const JWKS_TTL_MS = 10 * 60 * 1000;

export async function verifyAccess(request: Request, env: Env): Promise<AccessResult> {
  const team = (env.ACCESS_TEAM_DOMAIN ?? '').replace(/\/$/, '');
  const aud = env.ACCESS_AUD ?? '';
  if (!team || !aud) return { ok: false, status: 503, reason: 'access-not-configured' };

  const token = request.headers.get('Cf-Access-Jwt-Assertion') ?? cookie(request, 'CF_Authorization');
  if (!token) return { ok: false, status: 401, reason: 'no-token' };

  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, status: 401, reason: 'malformed' };
  let header: { alg?: string; kid?: string };
  let payload: { aud?: string | string[]; iss?: string; exp?: number; nbf?: number; email?: string };
  try {
    header = JSON.parse(b64urlText(parts[0]));
    payload = JSON.parse(b64urlText(parts[1]));
  } catch {
    return { ok: false, status: 401, reason: 'malformed' };
  }
  if (header.alg !== 'RS256' || !header.kid) return { ok: false, status: 401, reason: 'alg' };

  const now = Math.floor(Date.now() / 1000);
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!auds.includes(aud)) return { ok: false, status: 401, reason: 'aud' };
  if (payload.iss !== team) return { ok: false, status: 401, reason: 'iss' };
  if (!payload.exp || payload.exp < now - 30) return { ok: false, status: 401, reason: 'expired' };
  if (payload.nbf && payload.nbf > now + 30) return { ok: false, status: 401, reason: 'nbf' };
  if (!payload.email) return { ok: false, status: 401, reason: 'no-email' };

  const jwk = await findKey(team, header.kid);
  if (!jwk) return { ok: false, status: 401, reason: 'kid' };
  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) return { ok: false, status: 401, reason: 'signature' };
  return { ok: true, email: payload.email.toLowerCase() };
}

async function findKey(team: string, kid: string): Promise<Jwk | undefined> {
  const url = `${team}/cdn-cgi/access/certs`;
  const fresh = jwksCache && jwksCache.url === url && Date.now() - jwksCache.at < JWKS_TTL_MS;
  let key = fresh ? jwksCache!.keys.find((k) => k.kid === kid) : undefined;
  if (key) return key;
  // 캐시에 없으면(키 교체 등) 한 번 새로 받는다
  const res = await fetch(url);
  if (!res.ok) return undefined;
  const data = (await res.json()) as { keys?: Jwk[] };
  jwksCache = { url, at: Date.now(), keys: data.keys ?? [] };
  return jwksCache.keys.find((k) => k.kid === kid);
}

function cookie(request: Request, name: string): string | null {
  const raw = request.headers.get('Cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return null;
}

function b64urlBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlText(s: string): string {
  return new TextDecoder().decode(b64urlBytes(s));
}
