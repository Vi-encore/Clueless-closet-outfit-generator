// The same schema, pointed at the test database. `prisma migrate deploy --config
// prisma7.test.config.ts` keeps `closet_test` in step with `closet` without an
// environment variable that would have to be set differently on every platform.
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL_TEST'),
  },
});
