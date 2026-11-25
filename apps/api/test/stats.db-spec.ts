import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { CLOCK } from '../src/stats/stats.constants.js';
import { createDatabaseApp } from './create-app.js';
import type { Account, StatsBody, UnwornPage } from './test.interfaces.js';

let app: INestApplication<App>;
let prisma: PrismaService;

const PASSWORD = 'as if! whatever';

/** The statistics' "now": 23 November 2026, mid-morning, wherever the test runs. */
const NOW = new Date('2026-11-23T10:00:00Z');

beforeAll(async () => {
  app = await createDatabaseApp(undefined, (builder) =>
    builder.overrideProvider(CLOCK).useValue(() => NOW),
  );
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await app.close();
});

// Items go with their owner.
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

async function statsOf(account: Account): Promise<StatsBody> {
  const response = await request(app.getHttpServer())
    .get('/stats')
    .set('Authorization', `Bearer ${account.token}`);

  expect(response.status).toBe(200);
  return response.body as StatsBody;
}

const mostly = (family: string) => [
  { family, hex: '#808080', share: 0.8 },
  { family: 'grey', hex: '#808080', share: 0.2 },
];

/** An item written straight: wear counts and prices are what these scenarios are about. */
function anItem(
  owner: Account,
  data: {
    name?: string;
    slot?: string;
    type?: string;
    status?: string;
    wearCount?: number;
    price?: string;
    colors?: object[];
    lastWornAt?: Date;
    createdAt?: Date;
  },
) {
  return prisma.item.create({
    data: { ownerId: owner.id, slot: 'top', type: 'blouse', ...data },
  });
}

describe('Requirement: The wardrobe is counted', () => {
  it('Scenario: Items and the share worn', async () => {
    const cher = await register('cher');
    await anItem(cher, { wearCount: 2 });
    await anItem(cher, {});
    await anItem(cher, {});
    await anItem(cher, { status: 'laundry' });
    await anItem(cher, { status: 'archived', wearCount: 9 });

    const stats = await statsOf(cher);

    expect(stats.items).toBe(4);
    expect(stats.worn).toBe(1);
  });

  it('Scenario: By slot and by main colour', async () => {
    const cher = await register('cher');
    await anItem(cher, { colors: mostly('white') });
    await anItem(cher, { colors: mostly('red') });
    await anItem(cher, { slot: 'bottom', type: 'jeans' });

    const stats = await statsOf(cher);

    expect(stats.bySlot).toEqual([
      { slot: 'top', count: 2 },
      { slot: 'bottom', count: 1 },
    ]);
    expect(stats.byColor).toEqual(
      expect.arrayContaining([
        { family: 'white', count: 1 },
        { family: 'red', count: 1 },
        { family: null, count: 1 },
      ]),
    );
    expect(stats.byColor).toHaveLength(3);
  });

  it("Scenario: Another person's items are not counted", async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await anItem(dionne, { wearCount: 1 });
    await anItem(dionne, {});
    await anItem(dionne, {});

    const stats = await statsOf(cher);

    expect(stats).toMatchObject({ items: 0, worn: 0, bySlot: [], byColor: [], mostWorn: [] });
  });

  it('Scenario: Signing in is required', async () => {
    expect((await request(app.getHttpServer()).get('/stats')).status).toBe(401);
  });
});

describe('Requirement: The most worn items are listed', () => {
  it('Scenario: The most worn first', async () => {
    const cher = await register('cher');
    await anItem(cher, { name: 'Once', wearCount: 1 });
    await anItem(cher, { name: 'Five', wearCount: 5 });
    await anItem(cher, { name: 'Three', wearCount: 3 });
    await anItem(cher, { name: 'Never' });

    const { mostWorn } = await statsOf(cher);

    expect(mostWorn.map(({ name, wearCount }) => [name, wearCount])).toEqual([
      ['Five', 5],
      ['Three', 3],
      ['Once', 1],
    ]);
  });

  it('lists five at most', async () => {
    const cher = await register('cher');
    for (let wears = 1; wears <= 7; wears++) {
      await anItem(cher, { wearCount: wears });
    }

    expect((await statsOf(cher)).mostWorn).toHaveLength(5);
  });
});

describe('Requirement: Cost per wear is worked out', () => {
  it('Scenario: Cost per wear', async () => {
    const cher = await register('cher');
    await anItem(cher, {
      name: 'Coat',
      slot: 'outerwear',
      type: 'coat',
      price: '3000',
      wearCount: 4,
    });
    await anItem(cher, {
      name: 'Dress',
      slot: 'one_piece',
      type: 'dress',
      price: '1200',
      wearCount: 6,
    });
    await anItem(cher, { name: 'No price', wearCount: 3 });

    const { costPerWear } = await statsOf(cher);

    expect(
      costPerWear.map(({ item, perWear, currency }) => [item.name, perWear, currency]),
    ).toEqual([
      ['Dress', '200.00', 'UAH'],
      ['Coat', '750.00', 'UAH'],
    ]);
  });

  it('Scenario: Bought and not yet worn', async () => {
    const cher = await register('cher');
    await anItem(cher, { name: 'Shoes', slot: 'shoes', type: 'sneakers', price: '2500' });

    const { costPerWear, unwornWithPrice } = await statsOf(cher);

    expect(
      unwornWithPrice.map(({ item, price, currency }) => [item.name, price, currency]),
    ).toEqual([['Shoes', '2500.00', 'UAH']]);
    expect(costPerWear).toEqual([]);
  });
});

function unwornOf(account: Account, query = '') {
  return request(app.getHttpServer())
    .get(`/stats/unworn${query}`)
    .set('Authorization', `Bearer ${account.token}`);
}

const names = (page: UnwornPage) => page.items.map(({ item }) => item.name);

describe('Requirement: Items not worn for a long time are found', () => {
  it('Scenario: Not worn for 90 days', async () => {
    const cher = await register('cher');
    await anItem(cher, {
      name: 'July',
      wearCount: 1,
      lastWornAt: new Date('2026-07-01T12:00:00Z'),
      createdAt: new Date('2026-01-01T12:00:00Z'),
    });
    await anItem(cher, {
      name: 'November',
      wearCount: 1,
      lastWornAt: new Date('2026-11-01T12:00:00Z'),
      createdAt: new Date('2026-01-01T12:00:00Z'),
    });
    await anItem(cher, { name: 'March, never', createdAt: new Date('2026-03-01T12:00:00Z') });

    const response = await unwornOf(cher, '?days=90');

    expect(response.status).toBe(200);
    const page = response.body as UnwornPage;
    expect(names(page)).toEqual(['March, never', 'July']);
    expect(page.items[0]?.lastWornAt).toBeNull();
    expect(page.items[1]?.lastWornAt).toBe('2026-07-01T12:00:00.000Z');
    expect(page.nextCursor).toBeNull();
  });

  it('takes 90 days when none is given', async () => {
    const cher = await register('cher');
    await anItem(cher, { name: 'Sixty days', createdAt: new Date('2026-09-24T12:00:00Z') });
    await anItem(cher, { name: 'A hundred days', createdAt: new Date('2026-08-15T12:00:00Z') });

    expect(names((await unwornOf(cher)).body as UnwornPage)).toEqual(['A hundred days']);
    expect(names((await unwornOf(cher, '?days=30')).body as UnwornPage)).toEqual([
      'A hundred days',
      'Sixty days',
    ]);
  });

  it('Scenario: Read a page at a time', async () => {
    const cher = await register('cher');
    for (const day of ['01', '02', '03']) {
      await anItem(cher, { name: `March ${day}`, createdAt: new Date(`2026-03-${day}T12:00:00Z`) });
    }

    const first = (await unwornOf(cher, '?limit=2')).body as UnwornPage;
    expect(names(first)).toEqual(['March 01', 'March 02']);
    expect(first.nextCursor).not.toBeNull();

    const second = (await unwornOf(cher, `?limit=2&cursor=${first.nextCursor}`)).body as UnwornPage;
    expect(names(second)).toEqual(['March 03']);
    expect(second.nextCursor).toBeNull();
  });

  it('keeps one order for items unworn since the same moment', async () => {
    const cher = await register('cher');
    const same = new Date('2026-03-01T12:00:00Z');
    for (let n = 0; n < 5; n++) {
      await anItem(cher, { name: `Same ${n}`, createdAt: same });
    }

    const seen: string[] = [];
    let cursor: string | null = null;
    do {
      const query: string = cursor === null ? '?limit=2' : `?limit=2&cursor=${cursor}`;
      const page = (await unwornOf(cher, query)).body as UnwornPage;
      seen.push(...names(page).map(String));
      cursor = page.nextCursor;
    } while (cursor !== null);

    expect(new Set(seen).size).toBe(5);
    expect(seen).toHaveLength(5);
  });

  it('Scenario: A cursor that was not issued is refused', async () => {
    const cher = await register('cher');

    expect((await unwornOf(cher, '?cursor=not-a-cursor')).status).toBe(400);
  });

  it('Scenario: Another number of days is refused', async () => {
    const cher = await register('cher');

    expect((await unwornOf(cher, '?days=45')).status).toBe(400);
  });

  it('Scenario: Archived items are not offered', async () => {
    const cher = await register('cher');
    await anItem(cher, {
      name: 'Archived',
      status: 'archived',
      createdAt: new Date('2025-11-01T12:00:00Z'),
    });

    expect(names((await unwornOf(cher)).body as UnwornPage)).toEqual([]);
  });

  it("does not offer another person's items", async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await anItem(dionne, { name: 'Hers', createdAt: new Date('2025-11-01T12:00:00Z') });

    expect(names((await unwornOf(cher)).body as UnwornPage)).toEqual([]);
  });
});
