import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load .env.local first (Next.js convention), then .env (fallback)
config({ path: ['.env.local', '.env'] });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    path: 'prisma/migrations',
  },
});
