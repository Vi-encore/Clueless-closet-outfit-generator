import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * An application for the HTTP tests, with `PrismaService` replaced by a stand-in that
 * opens nothing.
 *
 * None of these routes touch the database, and `pnpm test` has to keep working on a
 * machine with no container running. The real service is exercised by the `.db-spec.ts`
 * suites, which do require one.
 */
export async function createTestApp(
  configure: (app: INestApplication<App>) => void = () => {},
): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({
      onModuleInit: async () => {},
      onModuleDestroy: async () => {},
    })
    .compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configure(app);
  await app.init();

  return app;
}
