import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createDatabaseApp } from './create-app.js';

let app: INestApplication<App>;
let prisma: PrismaService;

const PASSWORD = 'as if! whatever';

beforeAll(async () => {
  app = await createDatabaseApp();
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await prisma.user.deleteMany();
});

interface Account {
  id: string;
  token: string;
}

/** Registers an account and signs it in. */
async function register(username: string, displayName?: string): Promise<Account> {
  const email = `${username}@example.com`;
  const created = await request(app.getHttpServer())
    .post('/auth/sign-up')
    .send({ email, username, password: PASSWORD, displayName });
  const signedIn = await request(app.getHttpServer())
    .post('/auth/sign-in')
    .send({ email, password: PASSWORD });

  return { id: created.body.id, token: signedIn.body.accessToken };
}

function findPerson(account: Account, username: string) {
  return request(app.getHttpServer())
    .get(`/users/${username}`)
    .set('Authorization', `Bearer ${account.token}`);
}

describe('Requirement: A person is found by their exact username', () => {
  it('Scenario: Person found', async () => {
    const dionne = await register('dionne', 'Dionne Davenport');
    const cher = await register('cher');

    const response = await findPerson(cher, 'dionne');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: dionne.id,
      username: 'dionne',
      displayName: 'Dionne Davenport',
    });
  });

  it('Scenario: Nothing private is returned', async () => {
    await register('dionne');
    const cher = await register('cher');

    const response = await findPerson(cher, 'dionne');

    // Checked as an absence rather than against a list of allowed keys, because a
    // column added later should fail this test loudly if it leaks.
    expect(response.body.email).toBeUndefined();
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('Scenario: Case does not matter', async () => {
    await register('dionne');
    const cher = await register('cher');

    const response = await findPerson(cher, 'DIONNE');

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('dionne');
  });

  it('Scenario: Nobody by that name', async () => {
    const cher = await register('cher');

    const response = await findPerson(cher, 'tai');

    expect(response.status).toBe(404);
  });
});
