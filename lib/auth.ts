import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin, bearer } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from './prisma';

const githubEnabled = !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
const googleEnabled = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
const adminSpaOrigin = process.env.ADMIN_SPA_ORIGIN?.trim();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'sqlite' }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: true,
  },
  socialProviders: {
    ...(githubEnabled && {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    }),
    ...(googleEnabled && {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    }),
  },
  trustedOrigins: adminSpaOrigin ? [adminSpaOrigin] : [],
  user: {
    additionalFields: {
      tokenBalance: { type: 'number', defaultValue: 0, input: false },
      tokenTotal: { type: 'number', defaultValue: 0, input: false },
      imageQuota: { type: 'number', defaultValue: 0, input: false },
      imageUsed: { type: 'number', defaultValue: 0, input: false },
      invitedBy: { type: 'string', required: false, input: false },
    },
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
    bearer(),
    nextCookies(), // MUST be last
  ],
});

export type Session = typeof auth.$Infer.Session;
