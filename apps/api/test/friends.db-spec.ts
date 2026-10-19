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

function ask(account: Account, username: string) {
  return request(app.getHttpServer())
    .post(`/friends/${username}`)
    .set('Authorization', `Bearer ${account.token}`);
}

function accept(account: Account, username: string) {
  return request(app.getHttpServer())
    .post(`/friends/${username}/accept`)
    .set('Authorization', `Bearer ${account.token}`);
}

function listRequests(account: Account) {
  return request(app.getHttpServer())
    .get('/friends/requests')
    .set('Authorization', `Bearer ${account.token}`);
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

describe('Requirement: Asking to be friends', () => {
  it('Scenario: Request recorded', async () => {
    const cher = await register('cher');
    await register('dionne');

    const response = await ask(cher, 'dionne');

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('pending');
    expect(response.body.user.username).toBe('dionne');
    expect(response.body.requestedByMe).toBe(true);
  });

  it('Scenario: Asking back agrees', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await ask(dionne, 'cher');

    const response = await ask(cher, 'dionne');

    // Not 201: nothing was created, a pending relation became an accepted one.
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('accepted');
  });

  it('Scenario: Asking twice changes nothing', async () => {
    const cher = await register('cher');
    await register('dionne');
    await ask(cher, 'dionne');

    const response = await ask(cher, 'dionne');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('pending');
    expect(await prisma.friendship.count()).toBe(1);
  });

  it('Scenario: Nobody befriends themselves', async () => {
    const cher = await register('cher');

    const response = await ask(cher, 'cher');

    expect(response.status).toBe(400);
    expect(await prisma.friendship.count()).toBe(0);
  });
});

describe('Requirement: Requests waiting for you are listed', () => {
  it('Scenario: Incoming request listed', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await ask(dionne, 'cher');

    const response = await listRequests(cher);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user.username).toBe('dionne');
    expect(response.body[0].requestedByMe).toBe(false);
  });

  it('Scenario: Your own asking is not waiting for you', async () => {
    const cher = await register('cher');
    await register('dionne');
    await ask(cher, 'dionne');

    const response = await listRequests(cher);

    expect(response.body).toEqual([]);
  });
});

describe('Requirement: Agreeing to be friends', () => {
  it('Scenario: Request accepted', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await ask(dionne, 'cher');

    const response = await accept(cher, 'dionne');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('accepted');
  });

  it('Scenario: The asker cannot accept their own request', async () => {
    const cher = await register('cher');
    await register('dionne');
    await ask(cher, 'dionne');

    const response = await accept(cher, 'dionne');

    expect(response.status).toBe(404);

    const stored = await prisma.friendship.findFirstOrThrow();

    expect(stored.status).toBe('pending');
  });
});
