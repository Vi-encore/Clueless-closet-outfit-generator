import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import cookieParser from 'cookie-parser';
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
  // Registered in main.ts too, which the tests never run - the same trap as the
  // validation pipe and Swagger, and the third place it has to be repeated.
  app.use(cookieParser());
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
  // Registered in main.ts too, which the tests never run - the same trap as the
  // validation pipe and Swagger, and the third place it has to be repeated.
  app.use(cookieParser());
  configure(app);
  await app.init();

  return app;
}

/**
 * An application listening on a real port, for the socket suites.
 *
 * The other two factories hand their HTTP handler to `supertest`, which drives it
 * in memory and never binds anything - so a socket client would have nothing to
 * connect to. Port 0 asks the operating system for a free one rather than naming a
 * number: two test files, or one process left over from a previous run, would
 * collide on a fixed port and the failure would read as a flaky test.
 */
export async function createSocketApp(): Promise<{
  app: INestApplication<App>;
  port: number;
}> {
  const app = await createDatabaseApp();
  await app.listen(0);

  // `getHttpServer` is typed as supertest's `App`, which is a string or a server;
  // once `listen` has run it is the latter, and only that has an address.
  const server = app.getHttpServer() as Server;
  const { port } = server.address() as AddressInfo;

  return { app, port };
}
