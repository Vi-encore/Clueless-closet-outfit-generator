// Prisma 7 no longer reads .env by itself, so the file is loaded here. Without
// this line every CLI command would see an empty DATABASE_URL.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
