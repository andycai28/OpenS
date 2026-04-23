import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

function serialize(log: {
  id: string;
  level: string;
  message: string;
  stack: string | null;
  source: string | null;
  requestId: string | null;
  method: string | null;
  url: string | null;
  userId: string | null;
  metadata: string | null;
  createdAt: Date;
}) {
  return {
    id: log.id,
    level: log.level,
    message: log.message,
    stack: log.stack,
    source: log.source,
    request_id: log.requestId,
    method: log.method,
    url: log.url,
    user_id: log.userId,
    metadata: log.metadata,
    created_at: log.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));
  const level = searchParams.get('level')?.trim();
  const source = searchParams.get('source')?.trim();
  const search = searchParams.get('search')?.trim();
  const requestId = searchParams.get('request_id')?.trim();
  const userId = searchParams.get('user_id')?.trim();
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  const where: Prisma.SystemLogWhereInput = {};
  if (level) where.level = level;
  if (source) where.source = { contains: source };
  if (requestId) where.requestId = requestId;
  if (userId) where.userId = userId;
  if (search) where.message = { contains: search };
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [logs, total] = await Promise.all([
    prisma.systemLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.systemLog.count({ where }),
  ]);

  return NextResponse.json({
    logs: logs.map(serialize),
    total,
    page,
    pageSize,
  });
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const before = new URL(request.url).searchParams.get('before');
  if (!before) {
    return NextResponse.json(
      { success: false, error: 'Missing required ?before=<ISO date>' },
      { status: 400 },
    );
  }
  const cutoff = new Date(before);
  if (Number.isNaN(cutoff.getTime())) {
    return NextResponse.json(
      { success: false, error: 'Invalid date' },
      { status: 400 },
    );
  }

  const result = await prisma.systemLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return NextResponse.json({ success: true, deletedCount: result.count });
}
