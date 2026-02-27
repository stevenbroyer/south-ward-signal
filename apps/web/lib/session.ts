import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? 'admin';

/** Create an HMAC-signed session token */
export function createSessionToken(email: string): string {
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  const payload = `${email}:${expires}`;
  const sig = createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

/** Verify an HMAC-signed session token, return email or null */
export function verifySessionToken(token: string): string | null {
  const parts = token.split(':');
  if (parts.length !== 3) return null;

  const [email, expiresStr, sig] = parts;
  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires) || Date.now() > expires) return null;

  const expected = createHmac('sha256', SESSION_SECRET)
    .update(`${email}:${expiresStr}`)
    .digest('hex');

  try {
    if (!timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
      return null;
    }
  } catch {
    return null;
  }

  return email;
}
