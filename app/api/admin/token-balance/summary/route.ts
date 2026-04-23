import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    totalBalance: 0,
    totalIssued: 0,
    activeUsers: 0,
    totalImageQuota: 0,
    totalImageUsed: 0,
  });
}
