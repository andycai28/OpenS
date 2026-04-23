import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const log = await prisma.systemLog.findUnique({ where: { id } });
  if (!log) {
    return NextResponse.json(
      { success: false, error: 'Log not found' },
      { status: 404 },
    );
  }
  return NextResponse.json({
    log: {
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
    },
  });
}
