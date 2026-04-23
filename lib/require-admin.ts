/**
 * Admin session guard for /api/admin/* route handlers.
 * Returns the admin session, or a 401 NextResponse the route should return as-is.
 *
 * Usage:
 *   const auth = await requireAdmin(request);
 *   if (auth instanceof NextResponse) return auth;
 *   const admin = auth.user;
 */
import { NextResponse } from 'next/server';
import { adminAuth, type AdminSession } from './admin-auth';

export async function requireAdmin(
  request: Request,
): Promise<AdminSession | NextResponse> {
  const session = await adminAuth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        errorCode: 'ADMIN_UNAUTHENTICATED',
        error: 'Admin authentication required',
      },
      { status: 401 },
    );
  }
  return session;
}
