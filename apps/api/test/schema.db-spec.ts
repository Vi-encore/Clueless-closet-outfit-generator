import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '../src/generated/prisma/client.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let prisma: PrismaClient;

beforeAll(() => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  prisma = new PrismaClient({ adapter });
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Items go with their owner, so one delete empties both tables.
  await prisma.user.deleteMany();
});

function createUser(overrides: Partial<{ email: string; username: string }> = {}) {
  return prisma.user.create({
    data: {
      email: 'cher@example.com',
      username: 'cher',
      passwordHash: 'not a real hash',
      ...overrides,
    },
  });
}

describe('Requirement: Records are identified by UUID', () => {
  it('Scenario: Identifier assigned on insert', async () => {
    const user = await createUser();

    expect(user.id).toMatch(UUID);
  });
});

describe('Requirement: A username identifies a person', () => {
  it('Scenario: Username taken', async () => {
    await createUser();

    await expect(createUser({ email: 'dionne@example.com' })).rejects.toThrow();
  });

  it('Scenario: Email taken', async () => {
    await createUser();

    await expect(createUser({ username: 'dionne' })).rejects.toThrow();
  });
});

describe('Requirement: An item needs an owner, a slot and a type', () => {
  it('Scenario: Minimal item stored', async () => {
    const owner = await createUser();

    const item = await prisma.item.create({
      data: { ownerId: owner.id, slot: 'top', type: 'blouse' },
    });

    expect(item.id).toMatch(UUID);
    expect(item.name).toBeNull();
    expect(item.colors).toBeNull();
    expect(item.seasons).toEqual([]);
    expect(item.styles).toEqual([]);
  });

  it('Scenario: Owner does not exist', async () => {
    const nobody = '00000000-0000-4000-8000-000000000000';

    await expect(
      prisma.item.create({ data: { ownerId: nobody, slot: 'top', type: 'blouse' } }),
    ).rejects.toThrow();
  });
});

describe('Requirement: Items are private by default', () => {
  it('Scenario: Visibility not given', async () => {
    const owner = await createUser();

    const item = await prisma.item.create({
      data: { ownerId: owner.id, slot: 'top', type: 'blouse' },
    });

    expect(item.visibility).toBe('private');
  });
});

describe('Requirement: Items are archived, not deleted', () => {
  it('Scenario: Item archived', async () => {
    const owner = await createUser();
    const item = await prisma.item.create({
      data: { ownerId: owner.id, slot: 'top', type: 'blouse' },
    });

    await prisma.item.update({
      where: { id: item.id },
      data: { status: 'archived', archivedReason: 'worn out', archivedAt: new Date() },
    });

    const archived = await prisma.item.findUnique({ where: { id: item.id } });

    expect(archived).not.toBeNull();
    expect(archived?.status).toBe('archived');
    expect(archived?.archivedReason).toBe('worn out');
    expect(archived?.archivedAt).toBeInstanceOf(Date);
  });
});

describe('Requirement: Timestamps are stored with a time zone', () => {
  it('Scenario: Creation time recorded', async () => {
    const owner = await createUser();
    const item = await prisma.item.create({
      data: { ownerId: owner.id, slot: 'top', type: 'blouse' },
    });

    expect(item.createdAt).toBeInstanceOf(Date);

    // Asking the database itself, because this is the one property a round trip
    // through JavaScript cannot show: a Date looks the same either way.
    const columns = await prisma.$queryRaw<{ data_type: string }[]>`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_name = 'Item' AND column_name = 'createdAt'
    `;

    expect(columns[0]?.data_type).toBe('timestamp with time zone');
  });
});

describe('Requirement: A stored refresh token keeps only a hash', () => {
  const token = 'the-random-string-a-client-would-be-given';

  function store(userId: string) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
  }

  it('Scenario: Only a hash is stored', async () => {
    const owner = await createUser();

    const stored = await store(owner.id);

    // Every field at once, rather than the one we happen to suspect: the point is
    // that the token is nowhere in the row, not that one column avoided it.
    expect(JSON.stringify(stored)).not.toContain(token);
    expect(stored.userId).toBe(owner.id);
    expect(stored.expiresAt).toBeInstanceOf(Date);
    expect(stored.usedAt).toBeNull();
  });

  it('Scenario: Removed with its user', async () => {
    const owner = await createUser();
    await store(owner.id);

    await prisma.user.delete({ where: { id: owner.id } });

    expect(await prisma.refreshToken.count()).toBe(0);
  });
});
