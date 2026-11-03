import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '../src/generated/prisma/client.js';
import type { ColumnRow, UserIdentity } from './test.interfaces.js';

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

function createUser(overrides: Partial<UserIdentity> = {}) {
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
    const columns = await prisma.$queryRaw<ColumnRow[]>`
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

describe('Requirement: Each person holds their side of a relation', () => {
  async function twoPeople() {
    const cher = await createUser();
    const dionne = await createUser({ email: 'dionne@example.com', username: 'dionne' });

    return { cher, dionne };
  }

  /** One person's record about another, written the way the service writes each side. */
  function side(userId: string, otherUserId: string) {
    return prisma.friendship.create({ data: { userId, otherUserId } });
  }

  it('Scenario: One record per side', async () => {
    const { cher, dionne } = await twoPeople();
    await side(cher.id, dionne.id);
    // Dionne's record about Cher is the other side of the same relation, not a second one.
    await side(dionne.id, cher.id);

    await expect(side(cher.id, dionne.id)).rejects.toThrow();
  });

  it('Scenario: Removed with either person', async () => {
    const { cher, dionne } = await twoPeople();
    await side(cher.id, dionne.id);
    await side(dionne.id, cher.id);

    // Cher holds one record and is named in the other, so both have to go with her.
    await prisma.user.delete({ where: { id: cher.id } });

    expect(await prisma.friendship.count()).toBe(0);
  });
});

describe('Requirement: Two people have at most one direct conversation', () => {
  /** The key as the table stores it: the two ids sorted, smaller first. */
  function directKey(x: string, y: string) {
    return x < y ? `${x}:${y}` : `${y}:${x}`;
  }

  async function twoPeople() {
    const cher = await createUser();
    const dionne = await createUser({ email: 'dionne@example.com', username: 'dionne' });

    return { cher, dionne };
  }

  it('Scenario: One direct conversation per pair', async () => {
    const { cher, dionne } = await twoPeople();
    await prisma.conversation.create({ data: { directKey: directKey(cher.id, dionne.id) } });

    // The same two people, reached from the other side. Sorting the key is what
    // makes this the same conversation rather than a second one.
    await expect(
      prisma.conversation.create({ data: { directKey: directKey(dionne.id, cher.id) } }),
    ).rejects.toThrow();
  });

  it('Scenario: A message belongs to a conversation and a sender', async () => {
    const { cher, dionne } = await twoPeople();
    const conversation = await prisma.conversation.create({
      data: {
        directKey: directKey(cher.id, dionne.id),
        members: { create: [{ userId: cher.id }, { userId: dionne.id }] },
      },
    });

    const message = await prisma.message.create({
      data: {
        id: '11111111-1111-4111-8111-111111111111',
        conversationId: conversation.id,
        senderId: cher.id,
        body: 'as if!',
      },
    });

    expect(message.conversationId).toBe(conversation.id);
    expect(message.senderId).toBe(cher.id);
    expect(message.createdAt).toBeInstanceOf(Date);
  });

  it('Scenario: Messages go with their conversation', async () => {
    const { cher, dionne } = await twoPeople();
    const conversation = await prisma.conversation.create({
      data: {
        directKey: directKey(cher.id, dionne.id),
        members: { create: [{ userId: cher.id }, { userId: dionne.id }] },
      },
    });
    await prisma.message.create({
      data: {
        id: '22222222-2222-4222-8222-222222222222',
        conversationId: conversation.id,
        senderId: cher.id,
        body: 'as if!',
      },
    });

    await prisma.conversation.delete({ where: { id: conversation.id } });

    expect(await prisma.message.count()).toBe(0);
    expect(await prisma.conversationMember.count()).toBe(0);
  });
});
