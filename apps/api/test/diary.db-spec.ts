import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLOCK } from '../src/diary/diary.constants.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { StorageService } from '../src/storage/storage.service.js';
import { createDatabaseApp } from './create-app.js';
import type {
  Account,
  DiaryEntryBody,
  GenerateBody,
  MemoryBody,
  WearLogBody,
} from './test.interfaces.js';

let app: INestApplication<App>;
let prisma: PrismaService;

const PASSWORD = 'as if! whatever';

/** Noon in Kyiv, so the calendar day is the same in every time zone a test machine has. */
const NOON_22_NOVEMBER_2026 = new Date('2026-11-22T10:00:00Z');

// The diary's "now", which a scenario may move.
let now = NOON_22_NOVEMBER_2026;

beforeAll(async () => {
  app = await createDatabaseApp(undefined, (builder) =>
    builder.overrideProvider(CLOCK).useValue(() => now),
  );
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await app.close();
});

// Outfits and their wear records go with their owner.
beforeEach(async () => {
  await prisma.user.deleteMany();
  now = NOON_22_NOVEMBER_2026;
  vi.restoreAllMocks();
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

function call(account: Account, method: 'get' | 'post' | 'patch', path: string) {
  return request(app.getHttpServer())[method](path).set('Authorization', `Bearer ${account.token}`);
}

/** An outfit of a top and a bottom, through the generator, as a person gets one. */
async function anOutfit(account: Account): Promise<string> {
  await prisma.item.createMany({
    data: [
      { ownerId: account.id, slot: 'top', type: 'blouse' },
      { ownerId: account.id, slot: 'bottom', type: 'trousers' },
    ],
  });
  const response = await call(account, 'post', '/outfits/generate').send({ occasion: 'casual' });
  const { outfit } = response.body as GenerateBody;

  if (outfit === null) {
    throw new Error('No outfit was generated');
  }

  return outfit.id;
}

/** Today's record of a new outfit, as "wore it today" writes it. */
async function wornToday(account: Account): Promise<WearLogBody> {
  const outfitId = await anOutfit(account);

  return (await call(account, 'post', `/outfits/${outfitId}/wear`)).body as WearLogBody;
}

/** A record on a given day, written straight: the API records only today. */
async function wornOn(account: Account, outfitId: string, date: string): Promise<string> {
  const log = await prisma.wearLog.create({
    data: { ownerId: account.id, outfitId, date: new Date(`${date}T00:00:00Z`) },
  });

  return log.id;
}

async function keyFrom(account: Account, path: string): Promise<string> {
  const response = await call(account, 'post', path).send({ contentType: 'image/webp' });

  return response.body.key as string;
}

async function memoriesOf(account: Account): Promise<MemoryBody[]> {
  return (await call(account, 'get', '/diary/memories')).body as MemoryBody[];
}

describe('Requirement: A worn day takes a note and a photo', () => {
  it('Scenario: A note and a photo are added', async () => {
    const cher = await register('cher');
    const today = await wornToday(cher);
    const key = await keyFrom(cher, '/diary/upload-url');

    const response = await call(cher, 'patch', `/diary/${today.id}`).send({
      note: '  First day at the new school  ',
      photoKey: key,
    });

    expect(response.status).toBe(200);
    const entry = response.body as DiaryEntryBody;
    expect(entry.note).toBe('First day at the new school');
    expect(entry.photoUrl).toContain(key);
    expect(entry.outfit.items).toHaveLength(2);
  });

  it('Scenario: Clearing them', async () => {
    const cher = await register('cher');
    const today = await wornToday(cher);
    const key = await keyFrom(cher, '/diary/upload-url');
    await call(cher, 'patch', `/diary/${today.id}`).send({ note: 'As usual', photoKey: key });
    const remove = vi.spyOn(app.get(StorageService), 'remove');

    const response = await call(cher, 'patch', `/diary/${today.id}`).send({
      note: null,
      photoKey: null,
    });

    const entry = response.body as DiaryEntryBody;
    expect(entry.note).toBeNull();
    expect(entry.photoUrl).toBeNull();
    expect(remove).toHaveBeenCalledWith(key);
  });

  it('Scenario: An empty note is no note', async () => {
    const cher = await register('cher');
    const today = await wornToday(cher);

    const response = await call(cher, 'patch', `/diary/${today.id}`).send({ note: '   ' });

    expect((response.body as DiaryEntryBody).note).toBeNull();
  });

  it('Scenario: A note longer than 2000 characters is refused', async () => {
    const cher = await register('cher');
    const today = await wornToday(cher);

    const response = await call(cher, 'patch', `/diary/${today.id}`).send({
      note: 'a'.repeat(2001),
    });

    expect(response.status).toBe(400);
  });

  it("Scenario: Somebody else's record is not there", async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    const hers = await wornToday(cher);

    const response = await call(dionne, 'patch', `/diary/${hers.id}`).send({ note: 'Mine' });

    expect(response.status).toBe(404);
  });

  it("Scenario: Somebody else's diary key is refused", async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    const today = await wornToday(cher);
    const hers = await keyFrom(dionne, '/diary/upload-url');

    const response = await call(cher, 'patch', `/diary/${today.id}`).send({ photoKey: hers });

    expect(response.status).toBe(400);
  });
});

describe("Requirement: A diary photo is uploaded like an item's, to its own folder", () => {
  it('Scenario: A diary key is issued', async () => {
    const cher = await register('cher');

    expect(await keyFrom(cher, '/diary/upload-url')).toMatch(new RegExp(`^diary/${cher.id}/`));
  });

  it('Scenario: Signing in is required', async () => {
    const response = await request(app.getHttpServer())
      .post('/diary/upload-url')
      .send({ contentType: 'image/webp' });

    expect(response.status).toBe(401);
  });
});

describe('Requirement: A key belongs to the folder it was issued for', () => {
  it('Scenario: An item key on the diary is refused', async () => {
    const cher = await register('cher');
    const today = await wornToday(cher);
    const itemKey = await keyFrom(cher, '/items/upload-url');

    const response = await call(cher, 'patch', `/diary/${today.id}`).send({ photoKey: itemKey });

    expect(response.status).toBe(400);
  });
});

describe('Requirement: A month of the diary is read in date order', () => {
  it("Scenario: The month's days are listed", async () => {
    const cher = await register('cher');
    const outfit = await anOutfit(cher);
    await wornOn(cher, outfit, '2026-03-17');
    await wornOn(cher, outfit, '2026-04-02');
    await wornOn(cher, outfit, '2026-03-03');

    const response = await call(cher, 'get', '/diary?month=2026-03');

    expect(response.status).toBe(200);
    const entries = response.body as DiaryEntryBody[];
    expect(entries.map(({ date }) => date)).toEqual(['2026-03-03', '2026-03-17']);
    expect(entries.every(({ outfit: { items } }) => items.length === 2)).toBe(true);
  });

  it('Scenario: A month in another shape is refused', async () => {
    const cher = await register('cher');

    expect((await call(cher, 'get', '/diary?month=March')).status).toBe(400);
  });

  it("Scenario: Another person's days are not listed", async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await wornOn(dionne, await anOutfit(dionne), '2026-03-10');

    const response = await call(cher, 'get', '/diary?month=2026-03');

    expect(response.body).toEqual([]);
  });
});

describe('Requirement: Memories are of the same day a year and a month ago', () => {
  it('Scenario: A year ago today', async () => {
    const cher = await register('cher');
    const id = await wornOn(cher, await anOutfit(cher), '2025-11-22');

    const memories = await memoriesOf(cher);

    expect(memories.map(({ kind, entry }) => [kind, entry.id])).toEqual([['year', id]]);
  });

  it('Scenario: A month ago today', async () => {
    const cher = await register('cher');
    const id = await wornOn(cher, await anOutfit(cher), '2026-10-22');

    const memories = await memoriesOf(cher);

    expect(memories.map(({ kind, entry }) => [kind, entry.id])).toEqual([['month', id]]);
  });

  it('Scenario: No such day a month ago', async () => {
    now = new Date('2027-03-31T10:00:00Z');
    const cher = await register('cher');
    // The nearest day February has; nothing may stand in for the 31st.
    await wornOn(cher, await anOutfit(cher), '2027-02-28');

    expect(await memoriesOf(cher)).toEqual([]);
  });

  it('Scenario: Nothing to remember', async () => {
    const cher = await register('cher');
    await wornOn(cher, await anOutfit(cher), '2026-11-21');

    const response = await call(cher, 'get', '/diary/memories');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("Scenario: Another person's days are not remembered", async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await wornOn(dionne, await anOutfit(dionne), '2025-11-22');

    expect(await memoriesOf(cher)).toEqual([]);
  });
});
