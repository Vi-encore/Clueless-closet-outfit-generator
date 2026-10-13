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

/**
 * An application wired to the real database, for the `.db-spec.ts` suites.
 *
 * The split is by what a suite needs running, not by whether it speaks HTTP: these
 * go through the routes like any other end-to-end test, but they need a container.
 */
export async function createDatabaseApp(
  configure: (app: INestApplication<App>) => void = () => {},
): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication<INestApplication<App>>();
  configure(app);
  await app.init();

  return app;
}
