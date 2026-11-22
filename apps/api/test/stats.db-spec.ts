import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createDatabaseApp } from './create-app.js';
import type { Account, StatsBody } from './test.interfaces.js';

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
