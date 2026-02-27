import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/lib/session';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@southwardsignal.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/** POST — Login with email/password */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = createSessionToken(email);

    const response = NextResponse.json({
      user: { id: 'admin', email },
    });

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
