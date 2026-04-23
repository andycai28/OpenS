import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

const DAY_MS = 24 * 3600_000;

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const now = Date.now();
  const startOfToday = new Date(new Date(now).toISOString().slice(0, 10));
  const sevenDaysAgo = new Date(now - 7 * DAY_MS);

  const [totalLogs, errorCount, todayErrors, warnCount, recentLevels] =
    await Promise.all([
      prisma.systemLog.count(),
      prisma.systemLog.count({ where: { level: 'error' } }),
      prisma.systemLog.count({
        where: { level: 'error', createdAt: { gte: startOfToday } },
      }),
      prisma.systemLog.count({ where: { level: 'warn' } }),
      prisma.systemLog.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          level: { in: ['error', 'warn'] },
        },
        select: { level: true, createdAt: true },
      }),
    ]);

  const dailyTrend: Record<string, { error: number; warn: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const key = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
    dailyTrend[key] = { error: 0, warn: 0 };
  }
  for (const log of recentLevels) {
    const key = log.createdAt.toISOString().slice(0, 10);
    if (key in dailyTrend) {
      if (log.level === 'error') dailyTrend[key].error++;
      else if (log.level === 'warn') dailyTrend[key].warn++;
    }
  }

  return NextResponse.json({
    totalLogs,
    errorCount,
    todayErrors,
    warnCount,
    dailyTrend,
  });
}
