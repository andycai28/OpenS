/**
 * Independent Better-Auth instance for the admin backend.
 * Uses separate AdminUser/AdminSession/AdminAccount/AdminVerification tables.
 * Sign-up is disabled — admins are seeded or created by other admins.
 */
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, bearer } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from './prisma';

const adminSpaOrigin = process.env.ADMIN_SPA_ORIGIN?.trim();

export const adminAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'sqlite' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
  basePath: '/api/admin-auth',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
    disableSignUp: true,
  },
  user: { modelName: 'AdminUser' },
  session: { modelName: 'AdminSession' },
  account: { modelName: 'AdminAccount' },
  verification: { modelName: 'AdminVerification' },
  trustedOrigins: adminSpaOrigin ? [adminSpaOrigin] : [],
  advanced: {
    cookiePrefix: 'admin-auth',
  },
  plugins: [
    admin(),
    bearer(),
    nextCookies(), // MUST be last
  ],
});

export type AdminSession = typeof adminAuth.$Infer.Session;
