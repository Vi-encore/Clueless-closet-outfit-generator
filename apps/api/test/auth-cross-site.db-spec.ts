import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * The cookie as a client on another origin has to receive it.
 *
 * Its own file because `COOKIE_SAMESITE` has to be set before `AppModule` is
 * imported - `ConfigModule.forRoot` reads and validates the environment while the
 * import runs, so a line inside a test would be far too late. The same reason
 * `docs-production.e2e-spec.ts` is a file of its own.
 */
let app: INestApplication<App>;
let originalSameSite: string | undefined;

const account = {
  email: 'cross-site@example.com',
  username: 'crosssite',
  password: 'as if! whatever',
};

beforeAll(async () => {
  originalSameSite = process.env.COOKIE_SAMESITE;
  process.env.COOKIE_SAMESITE = 'none';

  const cookieParser = (await import('cookie-parser')).default;
  const { Test } = await import('@nestjs/testing');
  const { AppModule } = await import('../src/app.module.js');
  const { PrismaService } = await import('../src/prisma/prisma.service.js');

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  app = moduleRef.createNestApplication<INestApplication<App>>();
  app.use(cookieParser());
  await app.init();

  await app.get(PrismaService).user.deleteMany({ where: { email: account.email } });
});

afterAll(async () => {
  await app.close();

  if (originalSameSite === undefined) {
    delete process.env.COOKIE_SAMESITE;
  } else {
    process.env.COOKIE_SAMESITE = originalSameSite;
  }
});

describe('Requirement: The refresh cookie can reach a client on another origin', () => {
  it('Scenario: The configured attribute is used', async () => {
    await request(app.getHttpServer()).post('/auth/sign-up').send(account);

    const response = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({ email: account.email, password: account.password });
    const cookie = (response.headers['set-cookie'] as unknown as string[])[0] as string;

    expect(cookie).toContain('SameSite=None');
    // Not a separate decision: browsers reject `None` without `Secure`, so a cookie
    // that says one has to say the other or it is dropped on arrival.
    expect(cookie).toContain('Secure');
  });
});
