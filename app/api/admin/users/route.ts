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
  const role = searchParams.get('role')?.trim() ?? '';

  const where: Prisma.UserWhereInput = {};
  if (search) {
    where.OR = [{ email: { contains: search } }, { name: { contains: search } }];
  }
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        accounts: {
          where: { providerId: { not: 'credential' } },
          select: { providerId: true },
          take: 1,
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      avatar_url: u.image,
      oauth_provider: u.accounts[0]?.providerId ?? null,
      role: u.role,
      is_active: !u.banned,
      created_at: u.createdAt.toISOString(),
      _count: { projects: 0 },
    })),
    total,
    page,
    pageSize,
  });
}
