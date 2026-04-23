import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({
    summary: { totalTokens: 0, totalCost: 0, todayTokens: 0, todayCost: 0, totalCalls: 0 },
    timeSeries: [],
  });
}
