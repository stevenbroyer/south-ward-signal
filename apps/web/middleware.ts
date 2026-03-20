import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass the current URL to layout so it can conditionally render chrome
  const response = NextResponse.next();
  response.headers.set('x-next-url', pathname);

  // Don't protect the login page or auth API
  if (pathname === '/admin/login' || pathname === '/api/admin/auth') {
    return response;
  }

  // Protect all other /admin and /api/admin routes — check for session cookie
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const accessToken = request.cookies.get('sb-access-token')?.value;
    if (!accessToken) {
      // API routes get 401, pages get redirected to login
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
