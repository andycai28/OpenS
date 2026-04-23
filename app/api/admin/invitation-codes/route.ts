import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));
  const search = searchParams.get('search')?.trim() ?? '';
  const status = searchParams.get('status')?.trim() ?? '';

  const where: Prisma.InvitationCodeWhereInput = {};
  if (search) where.code = { contains: search };
  if (status) where.status = status;

  const [codes, total, allCounts] = await Promise.all([
    prisma.invitationCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        usedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.invitationCode.count({ where }),
    prisma.invitationCode.groupBy({ by: ['status'], _count: true }),
  ]);

  const statusCounts = { active: 0, used: 0, disabled: 0 };
  for (const c of allCounts) {
    if (c.status in statusCounts) {
      statusCounts[c.status as keyof typeof statusCounts] = c._count as unknown as number;
    }
  }

  return NextResponse.json({
    codes: codes.map((c) => ({
      id: c.id,
      code: c.code,
      status: c.status,
      used_by: c.usedBy
        ? { id: c.usedBy.id, name: c.usedBy.name, email: c.usedBy.email }
        : null,
      note: c.note,
      created_at: c.createdAt.toISOString(),
      used_at: c.usedAt?.toISOString() ?? null,
    })),
    total,
    page,
    pageSize,
    statusCounts,
  });
}
