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

function block(account: Account, username: string) {
  return request(app.getHttpServer())
    .post(`/friends/${username}/block`)
    .set('Authorization', `Bearer ${account.token}`);
}

function listFriends(account: Account) {
  return request(app.getHttpServer())
    .get('/friends')
    .set('Authorization', `Bearer ${account.token}`);
}

function removeRelation(account: Account, username: string) {
  return request(app.getHttpServer())
    .delete(`/friends/${username}`)
    .set('Authorization', `Bearer ${account.token}`);
}

function listSent(account: Account) {
  return request(app.getHttpServer())
    .get('/friends/requests/sent')
    .set('Authorization', `Bearer ${account.token}`);
}

function listBlocked(account: Account) {
  return request(app.getHttpServer())
    .get('/friends/blocked')
    .set('Authorization', `Bearer ${account.token}`);
}

/** Two accounts that have agreed, which several scenarios start from. */
async function befriend(a: Account, b: Account) {
  await ask(a, await usernameOf(b));
  await accept(b, await usernameOf(a));
}

/** The username an account registered under, read back from the database. */
async function usernameOf(account: Account): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: account.id },
    select: { username: true },
  });

  return user.username;
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

describe('Requirement: Friends are listed', () => {
  it('Scenario: Friend listed', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne);

    const response = await listFriends(cher);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user.username).toBe('dionne');
  });

  it('Scenario: A pending request is not a friend', async () => {
    const cher = await register('cher');
    await register('dionne');
    await ask(cher, 'dionne');

    const response = await listFriends(cher);

    expect(response.body).toEqual([]);
  });
});

describe('Requirement: Any relation can be removed', () => {
  it('Scenario: Friendship ended', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne);

    const response = await removeRelation(cher, 'dionne');

    expect(response.status).toBe(200);
    // Both sides, because one row described the two of them.
    expect((await listFriends(cher)).body).toEqual([]);
    expect((await listFriends(dionne)).body).toEqual([]);
  });

  it('Scenario: Request declined', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await ask(dionne, 'cher');

    await removeRelation(cher, 'dionne');

    expect((await listRequests(cher)).body).toEqual([]);
    // Declining leaves no record, so nothing stops them asking again.
    expect((await ask(dionne, 'cher')).status).toBe(201);
  });

  it('Scenario: Nothing to remove', async () => {
    const cher = await register('cher');
    await register('dionne');

    const response = await removeRelation(cher, 'dionne');

    expect(response.status).toBe(404);
  });
});

describe('Requirement: A blocked person cannot reach you', () => {
  it('Scenario: Blocking ends a friendship', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne);

    const response = await block(cher, 'dionne');

    expect(response.status).toBe(200);
    expect((await listFriends(cher)).body).toEqual([]);
    expect((await listFriends(dionne)).body).toEqual([]);
  });

  it('Scenario: A blocked person cannot ask again', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await block(cher, 'dionne');

    const response = await ask(dionne, 'cher');

    // 404, the same answer a name nobody holds gets: a block that announced itself
    // would be half of no block at all.
    expect(response.status).toBe(404);
    expect((await listRequests(cher)).body).toEqual([]);
  });

  it('Scenario: Only the blocker can lift the block', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await block(cher, 'dionne');

    const response = await removeRelation(dionne, 'cher');

    expect(response.status).toBe(404);

    const stored = await prisma.friendship.findFirstOrThrow();

    expect(stored.status).toBe('blocked');
    expect((await listBlocked(cher)).body).toHaveLength(1);
  });

  it('Scenario: Unblocking leaves nothing behind', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await block(cher, 'dionne');

    await removeRelation(cher, 'dionne');

    expect(await prisma.friendship.count()).toBe(0);
    expect((await ask(dionne, 'cher')).status).toBe(201);
  });
});

describe('Requirement: Requests you sent are listed', () => {
  it('Scenario: A sent request is listed', async () => {
    const cher = await register('cher');
    await register('dionne');
    await ask(cher, 'dionne');

    const response = await listSent(cher);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user.username).toBe('dionne');
    expect(response.body[0].requestedByMe).toBe(true);
  });

  it('Scenario: A request waiting for you is not one you sent', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await ask(cher, 'dionne');

    const response = await listSent(dionne);

    expect(response.body).toEqual([]);
  });

  it('Scenario: An answered request leaves the list', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne);

    const response = await listSent(cher);

    expect(response.body).toEqual([]);
  });
});

describe('Requirement: People you blocked are listed', () => {
  it('Scenario: A block is listed', async () => {
    const cher = await register('cher');
    await register('tai');
    await block(cher, 'tai');

    const response = await listBlocked(cher);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user.username).toBe('tai');
  });

  it('Scenario: Being blocked is not listed', async () => {
    const cher = await register('cher');
    const tai = await register('tai');
    await block(cher, 'tai');

    const response = await listBlocked(tai);

    expect(response.body).toEqual([]);
  });
});

describe("Requirement: Each person's block is their own", () => {
  /** `cher` and `tai`, each having blocked the other. */
  async function blockedBothWays() {
    const cher = await register('cher');
    const tai = await register('tai');
    await block(cher, 'tai');
    await block(tai, 'cher');

    return { cher, tai };
  }

  it('Scenario: Two people can block each other', async () => {
    const { cher, tai } = await blockedBothWays();

    expect((await listBlocked(cher)).body[0].user.username).toBe('tai');
    expect((await listBlocked(tai)).body[0].user.username).toBe('cher');
  });

  it('Scenario: A block cannot be lifted from under it', async () => {
    const cher = await register('cher');
    const tai = await register('tai');
    await block(cher, 'tai');

    const removal = await removeRelation(tai, 'cher');

    expect(removal.status).toBe(404);
    expect((await listBlocked(cher)).body).toHaveLength(1);
  });

  it('Scenario: Blocking back does not take a block over', async () => {
    const { cher, tai } = await blockedBothWays();

    await removeRelation(tai, 'cher');

    expect((await listBlocked(tai)).body).toEqual([]);
    expect((await listBlocked(cher)).body).toHaveLength(1);
    expect((await ask(tai, 'cher')).status).toBe(404);
  });

  it('Scenario: Lifting both leaves nothing between them', async () => {
    const { cher, tai } = await blockedBothWays();

    await removeRelation(cher, 'tai');
    await removeRelation(tai, 'cher');

    expect(await prisma.friendship.count()).toBe(0);
    expect((await ask(cher, 'tai')).status).toBe(201);
  });
});
