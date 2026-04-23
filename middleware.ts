/**
 * Auth gate — every request needs a valid Better-Auth session.
 * Unauthenticated API requests get 401; pages get redirected to /sign-in.
 *
 * Admin paths (/api/admin-auth/*, /api/admin/*) bypass this gate; admin
 * endpoints validate their own session via lib/require-admin.ts and the
 * cross-origin admin SPA receives CORS headers here.
 */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const PUBLIC_PAGES = new Set(['/sign-in', '/sign-up']);

const PUBLIC_API_PREFIXES = ['/api/auth/', '/api/health'];

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

function isAdminApi(pathname: string): boolean {
  return pathname.startsWith('/api/admin-auth/') || pathname.startsWith('/api/admin/');
}

function applyCors(response: NextResponse, request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  const trusted = process.env.ADMIN_SPA_ORIGIN?.trim();
  if (origin && trusted && origin === trusted) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, Cookie',
    );
    response.headers.set('Vary', 'Origin');
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CORS preflight for admin paths
  if (request.method === 'OPTIONS' && isAdminApi(pathname)) {
    return applyCors(new NextResponse(null, { status: 204 }), request);
  }

  // Admin paths bypass C-end auth; their handlers do their own check
  if (isAdminApi(pathname)) {
    return applyCors(NextResponse.next(), request);
  }

  if (isPublicApi(pathname) || PUBLIC_PAGES.has(pathname)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: request.headers });

  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { success: false, errorCode: 'UNAUTHENTICATED', error: 'Authentication required' },
      { status: 401 },
    );
  }

  const signInUrl = new URL('/sign-in', request.url);
  if (pathname !== '/') signInUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logos/).*)'],
};
