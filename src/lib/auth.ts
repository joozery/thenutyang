const COOKIE_NAME = 'admin_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 วัน

function secret() {
  return process.env.SESSION_SECRET ?? 'change-me-to-a-long-random-string-in-production';
}

async function hmacSign(value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createSessionToken(): Promise<string> {
  const payload = btoa(JSON.stringify({ role: 'admin', exp: Date.now() + MAX_AGE * 1000 }));
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if ((await hmacSign(payload)) !== sig) return false;
  try {
    const { exp } = JSON.parse(atob(payload));
    return Date.now() < exp;
  } catch { return false; }
}

export { COOKIE_NAME, MAX_AGE };
