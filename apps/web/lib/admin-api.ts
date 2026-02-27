import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/session';

/**
 * Verify the admin session from HTTP-only cookies.
 * Call this at the top of every admin API route.
 * Returns the authenticated user or null.
 */
export async function verifyAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;

  if (!token) return null;

  const email = verifySessionToken(token);
  if (!email) return null;

  return { id: 'admin', email };
}
