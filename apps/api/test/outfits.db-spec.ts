import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createDatabaseApp } from './create-app.js';
import type {
  Account,
  GenerateBody,
  ItemSeed,
  OutfitBody,
  OutfitPage,
  WearLogBody,
} from './test.interfaces.js';

let app: INestApplication<App>;
let prisma: PrismaService;

const PASSWORD = 'as if! whatever';

/** How many times a "never" or "always" is checked against the generator's randomness. */
const RUNS = 15;

beforeAll(async () => {
  app = await createDatabaseApp();
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await app.close();
});

// Items, outfits and wear records all go with their owner.
beforeEach(async () => {
  await prisma.user.deleteMany();
});

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

/**
 * An item written straight to the database. `POST /items` wants a photo and nothing
 * else here cares about one, and a status other than `available` cannot be posted.
 */
async function addItem(owner: Account, seed: ItemSeed): Promise<string> {
  const item = await prisma.item.create({ data: { ownerId: owner.id, ...seed } });
  return item.id;
}

function generate(account: Account, body: object) {
  return request(app.getHttpServer())
    .post('/outfits/generate')
    .set('Authorization', `Bearer ${account.token}`)
    .send(body);
}

/** The outfit of a successful generation, failing the test when there is none. */
async function generated(account: Account, body: object): Promise<OutfitBody> {
  const response = await generate(account, body);
  expect(response.status).toBe(200);
  const { outfit } = response.body as GenerateBody;
  if (outfit === null) throw new Error('No outfit was generated');
  return outfit;
}

function idsOf(outfit: OutfitBody): string[] {
  return outfit.items.map((item) => item.id).sort();
}

describe("Requirement: An outfit is generated from the person's own wardrobe", () => {
  it('Scenario: An outfit for an occasion', async () => {
    const cher = await register('cher');
    const top = await addItem(cher, { slot: 'top', type: 'blouse' });
    const bottom = await addItem(cher, { slot: 'bottom', type: 'trousers' });

    const outfit = await generated(cher, { occasion: 'work' });

    expect(idsOf(outfit)).toEqual([top, bottom].sort());
    expect(outfit.occasion).toBe('work');
    expect(outfit.score).toEqual({
      total: expect.any(Number),
      breakdown: { color: expect.any(Number), formality: expect.any(Number) },
    });
    const stored = await prisma.outfit.findUnique({
      where: { id: outfit.id },
      include: { items: true },
    });
    expect(stored?.ownerId).toBe(cher.id);
    expect(stored?.occasion).toBe('work');
    expect(stored?.items.map((item) => item.itemId).sort()).toEqual([top, bottom].sort());
  });

  it('Scenario: Only their own available items', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    const top = await addItem(cher, { slot: 'top', type: 'blouse' });
    const bottom = await addItem(cher, { slot: 'bottom', type: 'skirt' });
    await addItem(cher, { slot: 'top', type: 't_shirt', status: 'laundry' });
    await addItem(dionne, { slot: 'bottom', type: 'jeans' });

    for (let run = 0; run < RUNS; run++) {
      const outfit = await generated(cher, { occasion: 'casual' });
      expect(idsOf(outfit)).toEqual([top, bottom].sort());
    }
  });

  it('Scenario: Nothing to make an outfit from', async () => {
    const cher = await register('cher');
    await addItem(cher, { slot: 'top', type: 'blouse' });
    await addItem(cher, { slot: 'top', type: 'shirt' });

    const response = await generate(cher, { occasion: 'casual' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ outfit: null });
    expect(await prisma.outfit.count()).toBe(0);
  });

  it('Scenario: An unknown occasion', async () => {
    const cher = await register('cher');

    expect((await generate(cher, { occasion: 'prom' })).status).toBe(400);
  });

  it('Scenario: Without signing in', async () => {
    const response = await request(app.getHttpServer())
      .post('/outfits/generate')
      .send({ occasion: 'casual' });

    expect(response.status).toBe(401);
  });
});

describe('Requirement: An outfit is generated around chosen items', () => {
  it('Scenario: Around a skirt', async () => {
    const cher = await register('cher');
    await addItem(cher, { slot: 'top', type: 'blouse' });
    await addItem(cher, { slot: 'bottom', type: 'trousers' });
    const skirt = await addItem(cher, { slot: 'bottom', type: 'skirt' });

    for (let run = 0; run < RUNS; run++) {
      const outfit = await generated(cher, { occasion: 'casual', mustInclude: [skirt] });
      expect(idsOf(outfit)).toContain(skirt);
    }
  });

  it("Scenario: Around someone else's item", async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await addItem(cher, { slot: 'top', type: 'blouse' });
    await addItem(cher, { slot: 'bottom', type: 'trousers' });
    const skirt = await addItem(dionne, { slot: 'bottom', type: 'skirt' });

    const response = await generate(cher, { occasion: 'casual', mustInclude: [skirt] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ outfit: null });
  });
});

describe('Requirement: Another one is another outfit', () => {
  it('Scenario: Another one', async () => {
    const cher = await register('cher');
    const top = await addItem(cher, { slot: 'top', type: 'blouse' });
    const first = await addItem(cher, { slot: 'bottom', type: 'trousers' });
    const second = await addItem(cher, { slot: 'bottom', type: 'skirt' });
    const shown = await generated(cher, { occasion: 'casual', mustInclude: [first] });

    for (let run = 0; run < RUNS; run++) {
      const outfit = await generated(cher, { occasion: 'casual', seen: [shown.id] });
      expect(idsOf(outfit)).toEqual([top, second].sort());
    }
  });
});

/** A person's outfit of a top and a bottom, generated through the API. */
async function anOutfit(account: Account): Promise<OutfitBody> {
  await addItem(account, { slot: 'top', type: 'blouse' });
  await addItem(account, { slot: 'bottom', type: 'trousers' });
  return generated(account, { occasion: 'casual' });
}

function call(account: Account, method: 'get' | 'put' | 'post' | 'delete', path: string) {
  return request(app.getHttpServer())[method](path).set('Authorization', `Bearer ${account.token}`);
}

function react(account: Account, id: string, reaction: string | null) {
  return call(account, 'put', `/outfits/${id}/reaction`).send({ reaction });
}

describe('Requirement: An outfit is readable only by its owner', () => {
  it("Scenario: Reading one's outfit", async () => {
    const cher = await register('cher');
    const shown = await anOutfit(cher);

    const response = await call(cher, 'get', `/outfits/${shown.id}`);

    expect(response.status).toBe(200);
    const outfit = response.body as OutfitBody;
    expect(outfit.items.map((item) => item.id)).toEqual(shown.items.map((item) => item.id));
    expect(outfit.items.map((item) => item.slot)).toEqual(['top', 'bottom']);
    expect(outfit.items.every((item) => 'photoUrl' in item)).toBe(true);
    expect(outfit.reaction).toBeNull();
    expect(outfit.savedAt).toBeNull();
  });

  it("Scenario: Someone else's outfit", async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    const theirs = await anOutfit(dionne);

    const answers = [
      await call(cher, 'get', `/outfits/${theirs.id}`),
      await react(cher, theirs.id, 'like'),
      await call(cher, 'put', `/outfits/${theirs.id}/save`),
      await call(cher, 'delete', `/outfits/${theirs.id}/save`),
      await call(cher, 'post', `/outfits/${theirs.id}/wear`),
    ];

    expect(answers.map((answer) => answer.status)).toEqual([404, 404, 404, 404, 404]);
    const untouched = await prisma.outfit.findUnique({ where: { id: theirs.id } });
    expect(untouched?.reaction).toBeNull();
    expect(untouched?.savedAt).toBeNull();
    expect(await prisma.wearLog.count()).toBe(0);
  });
});

describe('Requirement: An outfit can be liked or disliked', () => {
  it("Scenario: Like, then change one's mind", async () => {
    const cher = await register('cher');
    const outfit = await anOutfit(cher);

    expect((await react(cher, outfit.id, 'like')).body).toMatchObject({ reaction: 'like' });
    const response = await react(cher, outfit.id, 'dislike');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: outfit.id, reaction: 'dislike' });
  });

  it('Scenario: Taking the reaction back', async () => {
    const cher = await register('cher');
    const outfit = await anOutfit(cher);
    await react(cher, outfit.id, 'like');

    const response = await react(cher, outfit.id, null);

    expect(response.body).toMatchObject({ reaction: null });
    expect((await prisma.outfit.findUnique({ where: { id: outfit.id } }))?.reaction).toBeNull();
  });

  it('refuses a reaction that does not exist', async () => {
    const cher = await register('cher');
    const outfit = await anOutfit(cher);

    expect((await react(cher, outfit.id, 'love')).status).toBe(400);
  });
});

describe('Requirement: An outfit can be saved', () => {
  it('Scenario: Saving twice', async () => {
    const cher = await register('cher');
    const outfit = await anOutfit(cher);

    const first = await call(cher, 'put', `/outfits/${outfit.id}/save`);
    const second = await call(cher, 'put', `/outfits/${outfit.id}/save`);

    expect(first.status).toBe(200);
    expect((first.body as OutfitBody).savedAt).not.toBeNull();
    expect((second.body as OutfitBody).savedAt).toBe((first.body as OutfitBody).savedAt);
  });

  it('Scenario: The saved list', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await addItem(cher, { slot: 'top', type: 'blouse' });
    await addItem(cher, { slot: 'bottom', type: 'trousers' });
    await addItem(cher, { slot: 'bottom', type: 'skirt' });
    await addItem(cher, { slot: 'bottom', type: 'jeans' });
    const outfits: OutfitBody[] = [];
    for (let i = 0; i < 3; i++) {
      outfits.push(await generated(cher, { occasion: 'casual', seen: outfits.map((o) => o.id) }));
    }
    const [one, two] = outfits;
    if (one === undefined || two === undefined) throw new Error('Too few outfits');
    await call(cher, 'put', `/outfits/${one.id}/save`);
    await call(cher, 'put', `/outfits/${two.id}/save`);
    const theirs = await anOutfit(dionne);
    await call(dionne, 'put', `/outfits/${theirs.id}/save`);

    const response = await call(cher, 'get', '/outfits/saved');

    expect(response.status).toBe(200);
    const page = response.body as OutfitPage;
    expect(page.items.map((outfit) => outfit.id).sort()).toEqual([one.id, two.id].sort());
    expect(page.nextCursor).toBeNull();
  });

  it('Scenario: Unsaving', async () => {
    const cher = await register('cher');
    const outfit = await anOutfit(cher);
    await call(cher, 'put', `/outfits/${outfit.id}/save`);

    const response = await call(cher, 'delete', `/outfits/${outfit.id}/save`);

    expect(response.status).toBe(200);
    expect((response.body as OutfitBody).savedAt).toBeNull();
    const saved = await call(cher, 'get', '/outfits/saved');
    expect((saved.body as OutfitPage).items).toEqual([]);
  });
});

function wear(account: Account, id: string) {
  return call(account, 'post', `/outfits/${id}/wear`);
}

describe('Requirement: Wearing an outfit is recorded once a day', () => {
  it('Scenario: Wore it today', async () => {
    const cher = await register('cher');
    const outfit = await anOutfit(cher);

    const response = await wear(cher, outfit.id);

    expect(response.status).toBe(201);
    const log = response.body as WearLogBody;
    expect(log).toEqual({ id: expect.any(String), outfitId: outfit.id, date: expect.any(String) });
    expect(log.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const items = await prisma.item.findMany({ where: { ownerId: cher.id } });
    expect(items.map((item) => item.wearCount)).toEqual([1, 1]);
    expect(items.every((item) => item.lastWornAt !== null)).toBe(true);
  });

  it('Scenario: Twice the same day', async () => {
    const cher = await register('cher');
    const outfit = await anOutfit(cher);
    const first = await wear(cher, outfit.id);

    const second = await wear(cher, outfit.id);

    expect(second.status).toBe(201);
    expect(second.body).toEqual(first.body);
    expect(await prisma.wearLog.count()).toBe(1);
    const items = await prisma.item.findMany({ where: { ownerId: cher.id } });
    expect(items.map((item) => item.wearCount)).toEqual([1, 1]);
  });

  it('counts once when two requests arrive together', async () => {
    const cher = await register('cher');
    const outfit = await anOutfit(cher);

    const answers = await Promise.all([wear(cher, outfit.id), wear(cher, outfit.id)]);

    expect(answers.map((answer) => answer.status)).toEqual([201, 201]);
    expect(answers[0]?.body).toEqual(answers[1]?.body);
    expect(await prisma.wearLog.count()).toBe(1);
    const items = await prisma.item.findMany({ where: { ownerId: cher.id } });
    expect(items.map((item) => item.wearCount)).toEqual([1, 1]);
  });
});
