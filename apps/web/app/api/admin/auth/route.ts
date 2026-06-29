import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/session';
import { createAuthClient } from '@/lib/supabase-auth';

// Bootstrap credential — works even if Supabase Auth is unreachable, so you
// can never get locked out of the admin. Real accounts live in Supabase Auth
// and are managed from the Team panel.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@southwardsignal.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/** POST — Login with email/password (Supabase Auth, with env bootstrap fallback) */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    let authedEmail: string | null = null;

    // 1) Bootstrap env credential.
    if (
      ADMIN_EMAIL &&
      ADMIN_PASSWORD &&
      normalizedEmail === ADMIN_EMAIL.toLowerCase() &&
      password === ADMIN_PASSWORD
    ) {
      authedEmail = ADMIN_EMAIL;
    }

    // 2) Supabase Auth accounts.
    if (!authedEmail) {
      try {
        const supabase = createAuthClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (!error && data.user?.email) {
          authedEmail = data.user.email;
        }
      } catch {
        // Supabase unreachable — fall through to invalid-credentials below.
      }
    }

    if (!authedEmail) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = createSessionToken(authedEmail);
    const response = NextResponse.json({ user: { id: 'admin', email: authedEmail } });
    response.cookies.set('sb-access-token', token, COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error('Auth error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE — Logout, clear session cookie */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('sb-access-token', '', { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
