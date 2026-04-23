import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { requireAdmin } from '@/lib/require-admin';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await request.json()) as {
    role?: string;
    name?: string;
    is_active?: boolean;
  };

  const data: Prisma.UserUpdateInput = {};
  if (typeof body.role === 'string') data.role = body.role;
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.is_active === 'boolean') data.banned = !body.is_active;

  try {
    const user = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: !user.banned,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'User not found' },
      { status: 404 },
    );
  }
}
