/**
 * Create an admin account for the admin backend.
 * Bypasses disableSignUp by writing directly to AdminUser/AdminAccount via Prisma,
 * using Better-Auth's internal password hasher so the credential is compatible
 * with adminAuth.api.signInEmail.
 *
 * Usage:
 *   pnpm admin:seed <email> <password> [name]
 *   pnpm admin:seed                       # reads SEED_ADMIN_* from .env.local
 *
 * Env is loaded by `tsx --env-file=.env.local` (see package.json script).
 */
import { randomBytes } from 'node:crypto';
import { adminAuth } from '../lib/admin-auth';
import { prisma } from '../lib/prisma';

function generateId(): string {
  return randomBytes(16).toString('base64url');
}

async function main() {
  const email = process.argv[2] ?? process.env.SEED_ADMIN_EMAIL;
  const password = process.argv[3] ?? process.env.SEED_ADMIN_PASSWORD;
  const name = process.argv[4] ?? process.env.SEED_ADMIN_NAME ?? 'Admin';

  if (!email || !password) {
    console.error('Usage: pnpm admin:seed <email> <password> [name]');
    console.error('Or set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env.local');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.error(`Admin already exists: ${email}`);
    process.exit(1);
  }

  const ctx = await adminAuth.$context;
  const hash = await ctx.password.hash(password);

  const userId = generateId();
  const accountId = generateId();

  await prisma.$transaction([
    prisma.adminUser.create({
      data: {
        id: userId,
        email,
        name,
        emailVerified: true,
      },
    }),
    prisma.adminAccount.create({
      data: {
        id: accountId,
        userId,
        accountId: userId,
        providerId: 'credential',
        password: hash,
      },
    }),
  ]);

  console.log(`✓ Admin created: ${email}`);
  console.log(`  Sign in at: ${process.env.ADMIN_SPA_ORIGIN ?? 'http://localhost:5173'}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
