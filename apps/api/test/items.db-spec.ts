import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createDatabaseApp } from './create-app.js';

let app: INestApplication<App>;
let prisma: PrismaService;

const PASSWORD = 'as if! whatever';

/** The item most of these tests start from: the minimum plus a tag worth changing. */
const blouse = {
  slot: 'top',
  type: 'blouse',
  name: 'White satin blouse',
  formality: 3,
};

const jeans = {
  slot: 'bottom',
  type: 'jeans',
  name: 'Straight blue jeans',
  formality: 2,
};

/** A well-formed id that belongs to nothing, for the "not found" scenarios. */
const UNUSED_ID = '00000000-0000-4000-8000-000000000000';

beforeAll(async () => {
  app = await createDatabaseApp();
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await app.close();
});

// Items are gone with their owner, so one delete empties both tables.
beforeEach(async () => {
  await prisma.user.deleteMany();
});

interface Account {
  id: string;
  token: string;
}

/** Registers an account and signs it in, which is what every route here needs. */
async function register(username: string): Promise<Account> {
  const email = `${username}@example.com`;
  const created = await request(app.getHttpServer())
    .post('/auth/sign-up')
    .send({ email, username, password: PASSWORD });
  const signedIn = await request(app.getHttpServer())
    .post('/auth/sign-in')
    .send({ email, password: PASSWORD });

  return { id: created.body.id, token: signedIn.body.accessToken };
}

function postItem(account: Account, body: object) {
  return request(app.getHttpServer())
    .post('/items')
    .set('Authorization', `Bearer ${account.token}`)
    .send(body);
}

function listItems(account: Account, query = '') {
  return request(app.getHttpServer())
    .get(`/items${query}`)
    .set('Authorization', `Bearer ${account.token}`);
}

function patchItem(account: Account, id: string, body: object) {
  return request(app.getHttpServer())
    .patch(`/items/${id}`)
    .set('Authorization', `Bearer ${account.token}`)
    .send(body);
}

function wardrobeOf(account: Account, username: string) {
  return request(app.getHttpServer())
    .get(`/users/${username}/items`)
    .set('Authorization', `Bearer ${account.token}`);
}

/** Two accounts that have agreed to be friends. */
async function befriend(a: Account, b: Account) {
  const server = app.getHttpServer();
  const names = await prisma.user.findMany({
    where: { id: { in: [a.id, b.id] } },
    select: { id: true, username: true },
  });
  const nameOf = (id: string) => names.find((user) => user.id === id)?.username ?? '';

  await request(server)
    .post(`/friends/${nameOf(b.id)}`)
    .set('Authorization', `Bearer ${a.token}`);
  await request(server)
    .post(`/friends/${nameOf(a.id)}/accept`)
    .set('Authorization', `Bearer ${b.token}`);
}

function archiveItem(account: Account, id: string, query = '') {
  return request(app.getHttpServer())
    .delete(`/items/${id}${query}`)
    .set('Authorization', `Bearer ${account.token}`);
}

function getItem(account: Account, id: string) {
  return request(app.getHttpServer())
    .get(`/items/${id}`)
    .set('Authorization', `Bearer ${account.token}`);
}

/**
 * An archived item, written straight to the database.
 *
 * The route that archives one arrives in group 4; these scenarios are about reading,
 * and need the state to exist rather than the way of reaching it.
 */
async function archivedItem(account: Account, tags: { slot: string; type: string }) {
  return prisma.item.create({
    data: { ...tags, ownerId: account.id, status: 'archived', archivedAt: new Date() },
  });
}

/** The paths of every field the response complained about. */
function errorPaths(body: { errors?: { path: string }[] }): string[] {
  return (body.errors ?? []).map((error) => error.path);
}

describe("Requirement: An item is added to the signed-in person's wardrobe", () => {
  it('Scenario: Item stored', async () => {
    const cher = await register('cher');

    const response = await postItem(cher, blouse);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ slot: 'top', type: 'blouse', name: blouse.name });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.status).toBe('available');
    expect(response.body.visibility).toBe('private');
  });

  it('Scenario: Owner comes from the token', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');

    const response = await postItem(cher, { ...blouse, ownerId: dionne.id });

    expect(response.status).toBe(201);

    const stored = await prisma.item.findUniqueOrThrow({ where: { id: response.body.id } });

    expect(stored.ownerId).toBe(cher.id);
  });

  it('Scenario: Type does not belong to the slot', async () => {
    const cher = await register('cher');

    const response = await postItem(cher, { slot: 'bottom', type: 'blouse' });

    expect(response.status).toBe(400);
    expect(errorPaths(response.body)).toContain('type');
  });

  it('Scenario: Signing in is required', async () => {
    const response = await request(app.getHttpServer()).post('/items').send(blouse);

    expect(response.status).toBe(401);
  });
});

describe("Requirement: The wardrobe lists only its owner's items", () => {
  it('Scenario: Own items returned', async () => {
    const cher = await register('cher');
    await postItem(cher, blouse);
    await postItem(cher, jeans);

    const response = await listItems(cher);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.map((item: { type: string }) => item.type).sort()).toEqual([
      'blouse',
      'jeans',
    ]);
  });

  it('Scenario: Another wardrobe stays invisible', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await postItem(cher, blouse);

    const response = await listItems(dionne);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

describe('Requirement: An item is readable only by its owner', () => {
  it('Scenario: Owner reads the item', async () => {
    const cher = await register('cher');
    const created = await postItem(cher, blouse);

    const response = await getItem(cher, created.body.id);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ slot: 'top', type: 'blouse', formality: 3 });
  });

  it("Scenario: Somebody else's item is not found", async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    const created = await postItem(cher, blouse);

    const response = await getItem(dionne, created.body.id);

    expect(response.status).toBe(404);
  });

  it('Scenario: An unknown id answers the same way', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    const created = await postItem(cher, blouse);

    const somebodyElses = await getItem(dionne, created.body.id);
    const nobodys = await getItem(dionne, UNUSED_ID);

    expect(nobodys.status).toBe(404);
    // Identical down to the body: a guessed id must not be distinguishable from a hit.
    expect(nobodys.body).toEqual(somebodyElses.body);
  });
});

describe('Requirement: The wardrobe is narrowed by slot and status', () => {
  it('Scenario: Archived items are left out', async () => {
    const cher = await register('cher');
    await postItem(cher, blouse);
    await archivedItem(cher, jeans);

    const response = await listItems(cher);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].type).toBe('blouse');
  });

  it('Scenario: Archived items on request', async () => {
    const cher = await register('cher');
    await postItem(cher, blouse);
    await archivedItem(cher, jeans);

    const response = await listItems(cher, '?status=archived');

    expect(response.body).toHaveLength(1);
    expect(response.body[0].type).toBe('jeans');
  });

  it('Scenario: Narrowed by slot', async () => {
    const cher = await register('cher');
    await postItem(cher, blouse);
    await postItem(cher, jeans);

    const response = await listItems(cher, '?slot=top');

    expect(response.body).toHaveLength(1);
    expect(response.body[0].type).toBe('blouse');
  });

  it('Scenario: Unknown slot rejected', async () => {
    const cher = await register('cher');

    const response = await listItems(cher, '?slot=hat');

    expect(response.status).toBe(400);
    expect(errorPaths(response.body)).toContain('slot');
  });
});

describe('Requirement: Tags are corrected in place', () => {
  it('Scenario: One tag changed', async () => {
    const cher = await register('cher');
    const created = await postItem(cher, blouse);

    const response = await patchItem(cher, created.body.id, { formality: 4 });

    expect(response.status).toBe(200);
    expect(response.body.formality).toBe(4);
    // Everything not mentioned stays as it was: a patch is not a replacement.
    expect(response.body.name).toBe(blouse.name);
    expect(response.body.type).toBe('blouse');
  });

  it('Scenario: The pair is judged after merging', async () => {
    const cher = await register('cher');
    const created = await postItem(cher, blouse);

    // `jeans` is a valid type and `top` is a valid slot; only together are they wrong.
    const response = await patchItem(cher, created.body.id, { type: 'jeans' });

    expect(response.status).toBe(400);
    expect(errorPaths(response.body)).toContain('type');

    const stored = await getItem(cher, created.body.id);

    expect(stored.body.type).toBe('blouse');
  });

  it('Scenario: Slot and type change together', async () => {
    const cher = await register('cher');
    const created = await postItem(cher, blouse);

    const response = await patchItem(cher, created.body.id, { slot: 'bottom', type: 'jeans' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ slot: 'bottom', type: 'jeans' });
  });

  it('Scenario: A patch that names nothing is refused', async () => {
    const cher = await register('cher');
    const created = await postItem(cher, blouse);

    const response = await patchItem(cher, created.body.id, {});

    // Loud rather than quiet: an empty patch almost always means the client failed to
    // build its body, and answering 200 would let that ship unnoticed.
    expect(response.status).toBe(400);
  });

  it("Scenario: Somebody else's item cannot be changed", async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    const created = await postItem(cher, blouse);

    const response = await patchItem(dionne, created.body.id, { formality: 1 });

    expect(response.status).toBe(404);

    const stored = await getItem(cher, created.body.id);

    expect(stored.body.formality).toBe(3);
  });
});

describe('Requirement: An item is archived rather than deleted', () => {
  it('Scenario: Item archived with a reason', async () => {
    const cher = await register('cher');
    const created = await postItem(cher, blouse);

    const response = await archiveItem(cher, created.body.id, '?reason=worn_out');

    expect(response.status).toBe(200);

    // Still there: outfit history and statistics keep pointing at it.
    const stored = await getItem(cher, created.body.id);

    expect(stored.status).toBe(200);
    expect(stored.body.status).toBe('archived');
    expect(stored.body.archivedReason).toBe('worn_out');
    expect(stored.body.archivedAt).toEqual(expect.any(String));
  });

  it('Scenario: Archiving twice is not an error', async () => {
    const cher = await register('cher');
    const created = await postItem(cher, blouse);
    const first = await archiveItem(cher, created.body.id, '?reason=sold');

    const again = await archiveItem(cher, created.body.id, '?reason=damaged');

    expect(again.status).toBe(200);
    // The moment it left the wardrobe is the first one; a retry does not rewrite it.
    expect(again.body.archivedAt).toBe(first.body.archivedAt);
    expect(again.body.archivedReason).toBe('sold');
  });

  it("Scenario: Somebody else's item cannot be archived", async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    const created = await postItem(cher, blouse);

    const response = await archiveItem(dionne, created.body.id, '?reason=sold');

    expect(response.status).toBe(404);

    const stored = await getItem(cher, created.body.id);

    expect(stored.body.status).toBe('available');
  });
});

describe('Requirement: A friend sees the items marked for friends', () => {
  const shared = { ...blouse, visibility: 'friends' };

  it('Scenario: Friend sees a shared item', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne);
    await postItem(cher, shared);

    const response = await wardrobeOf(dionne, 'cher');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].type).toBe('blouse');
  });

  it('Scenario: Private items stay private', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne);
    await postItem(cher, shared);
    await postItem(cher, jeans);

    const response = await wardrobeOf(dionne, 'cher');

    expect(response.body).toHaveLength(1);
    expect(response.body[0].type).toBe('blouse');
  });

  it('Scenario: A stranger is told nothing', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await postItem(cher, shared);

    const response = await wardrobeOf(dionne, 'cher');

    // 404 rather than an empty list: an empty list would confirm `cher` exists.
    expect(response.status).toBe(404);
  });

  it('Scenario: A friend still cannot read an item by id', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne);
    const created = await postItem(cher, shared);

    const response = await getItem(dionne, created.body.id);

    // The friend view is a wardrobe, not a key to item ids.
    expect(response.status).toBe(404);
  });

  it('Scenario: Archived items are not shared', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne);
    const created = await postItem(cher, shared);
    await archiveItem(cher, created.body.id, '?reason=sold');

    const response = await wardrobeOf(dionne, 'cher');

    expect(response.body).toEqual([]);
  });
});
