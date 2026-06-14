export interface CustomerSession {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
}

export const CUSTOMER_COOKIE = 'customer_session';
export const CUSTOMER_MAX_AGE = 60 * 60 * 24 * 30; // 30 วัน

async function hmacSign(value: string): Promise<string> {
  const secret = process.env.SESSION_SECRET ?? 'change-me';
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createCustomerToken(session: CustomerSession): Promise<string> {
  const payload = btoa(JSON.stringify({ ...session, exp: Date.now() + CUSTOMER_MAX_AGE * 1000 }));
  const sig = await hmacSign(payload);
  return `${payload}.${sig}`;
}

export async function verifyCustomerToken(token: string): Promise<CustomerSession | null> {
  const dot = token.lastIndexOf('.');
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if ((await hmacSign(payload)) !== sig) return null;
  try {
    const { lineUserId, displayName, pictureUrl, exp } = JSON.parse(atob(payload));
    if (Date.now() > exp) return null;
    return { lineUserId, displayName, pictureUrl };
  } catch { return null; }
}
