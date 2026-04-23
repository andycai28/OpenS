import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

const DAY_MS = 24 * 3600_000;

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * DAY_MS);

  const [totalUsers, activeSessions, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.session.findMany({
      where: { updatedAt: { gte: sevenDaysAgo } },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  const dailyRegistrations: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const key = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
    dailyRegistrations[key] = 0;
  }
  for (const u of recentUsers) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (key in dailyRegistrations) dailyRegistrations[key]++;
  }

  return NextResponse.json({
    totalUsers,
    activeUsers: activeSessions.length,
    totalProjects: 0,
    totalVideos: 0,
    totalViews: 0,
    dailyRegistrations,
  });
}
