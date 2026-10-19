import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';

/**
 * The allowances this file runs under, small enough to spend in a few requests.
 *
 * `setup-db.ts` raises them to something the other suites never reach; these are set
 * before `AppModule` is imported below, which is the only moment they are read.
 */
const GENERAL = 2;
const PASSWORD = 3;

process.env.RATE_LIMIT_MAX = String(GENERAL);
process.env.AUTH_RATE_LIMIT_MAX = String(PASSWORD);
process.env.RATE_LIMIT_TTL = '60';

let app: INestApplication<App>;
let prisma: PrismaService;

const account = {
  email: 'cher@example.com',
  username: 'cher',
  password: 'as if! whatever',
};

/**
 * A fresh application per test, because the throttler counts in memory and every
 * request in this file comes from the same address. One application shared by the
 * file would carry each test's requests into the next.
 */
beforeEach(async () => {
  // Imported here rather than at the top of the file: `AppModule` reads the
  // environment the moment it is imported, and a static import would run first.
  const { createDatabaseApp } = await import('./create-app.js');
  const { PrismaService: Prisma } = await import('../src/prisma/prisma.service.js');

  app = await createDatabaseApp();
  prisma = app.get(Prisma);
  await prisma.user.deleteMany();
});

afterEach(async () => {
  await app.close();
});

function health() {
  return request(app.getHttpServer()).get('/health');
}

function signUp() {
  return request(app.getHttpServer()).post('/auth/sign-up').send(account);
}

function signIn() {
  return request(app.getHttpServer())
    .post('/auth/sign-in')
    .send({ email: account.email, password: account.password });
}

describe('Requirement: A caller who asks too often is refused', () => {
  it('Scenario: Too many requests are refused', async () => {
    expect((await health()).status).toBe(200);
    expect((await health()).status).toBe(200);

    expect((await health()).status).toBe(429);
  });

  it('Scenario: Signing in runs out sooner', async () => {
    // Sign-up and sign-in both take a password, so both spend the tighter allowance.
    await signUp();
    await signIn();
    await signIn();

    expect((await signIn()).status).toBe(429);

    // The general allowance is untouched: the two throttlers skip where the other
    // applies, so password routes never spend what reading a wardrobe uses.
    expect((await health()).status).toBe(200);
  });

  it('Scenario: Refusing costs nothing to verify', async () => {
    await signUp();
    await signIn();
    await signIn();

    const before = await prisma.refreshToken.count();
    const refused = await signIn();

    expect(refused.status).toBe(429);
    // The handler never ran: a successful sign-in writes a refresh token, and an
    // argon2 verification would have happened on the way. Both were skipped,
    // although the credentials were perfectly good.
    expect(await prisma.refreshToken.count()).toBe(before);
  });
});
