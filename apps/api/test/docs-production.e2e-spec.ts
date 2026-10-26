import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: INestApplication<App>;
let originalNodeEnv: string | undefined;

beforeAll(async () => {
  originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  // Imported here rather than at the top of the file on purpose: AppModule validates
  // the environment the moment it is imported, so the setting has to be in place
  // before that happens, and a static import would happen first.
  const { Test } = await import('@nestjs/testing');
  const { AppModule } = await import('../src/app.module.js');
  const { setupOpenApi } = await import('../src/docs/openapi.js');
  const { PrismaService } = await import('../src/prisma/prisma.service.js');

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PrismaService)
    .useValue({ onModuleInit: async () => {}, onModuleDestroy: async () => {} })
    .compile();

  app = moduleRef.createNestApplication<INestApplication<App>>();
  setupOpenApi(app);
  await app.init();
});

afterAll(async () => {
  await app.close();

  if (originalNodeEnv === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = originalNodeEnv;
  }
});

describe('Requirement: Interactive API documentation', () => {
  it('Scenario: Nothing is served in production', async () => {
    expect((await request(app.getHttpServer()).get('/docs')).status).toBe(404);
    expect((await request(app.getHttpServer()).get('/docs-json')).status).toBe(404);
  });
});
