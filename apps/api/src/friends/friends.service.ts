import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { isUniqueViolation } from '../prisma/errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortedPair } from '../sorted-pair.js';
import { UsersService } from '../users/users.service.js';
import type { FriendshipView, PairColumns, RequestResult } from './friends.interfaces.js';

export const PENDING = 'pending';
export const ACCEPTED = 'accepted';
export const BLOCKED = 'blocked';

const publicFields = { id: true, username: true, displayName: true } as const;
const withBothPeople = {
  lowerUser: { select: publicFields },
  higherUser: { select: publicFields },
};

type FriendshipRow = Prisma.FriendshipGetPayload<{ include: typeof withBothPeople }>;

/** The column holding this person's own block on a pair, and the one holding the other's. */
function blockColumns(me: string, row: { lowerUserId: string }) {
  return row.lowerUserId === me
    ? ({ mine: 'blockedByLower', theirs: 'blockedByHigher' } as const)
    : ({ mine: 'blockedByHigher', theirs: 'blockedByLower' } as const);
}

/**
 * The pair as the table stores it: the two ids sorted, smaller first.
 *
 * Every query and every write goes through this, which is what makes the unique
 * index mean "one relationship between these two people" rather than "one in this
 * direction".
 */
function pairOf(x: string, y: string): PairColumns {
  const [lowerUserId, higherUserId] = sortedPair(x, y);

  return { lowerUserId, higherUserId };
}

@Injectable()
export class FriendsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  /**
   * Asks to be friends, or agrees if they asked first.
   *
   * Answers as though the person did not exist when a block stands between the two,
   * in either direction. Telling somebody they have been blocked is the one thing a
   * block has to avoid doing.
   */
  async request(me: string, username: string): Promise<RequestResult> {
    const person = await this.users.findByUsername(username);

    if (person.id === me) {
      throw new BadRequestException('You are already your own friend');
    }

    const existing = await this.findRow(me, person.id);

    if (existing) {
      return { created: false, relation: await this.resolve(me, existing) };
    }

    try {
      const created = await this.prisma.friendship.create({
        data: { ...pairOf(me, person.id), requestedById: me },
        include: withBothPeople,
      });

      return { created: true, relation: this.view(me, created) };
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      // Their request landed between our read and our write, which means they asked
      // at the same moment we did. What both of them meant is yes.
      const row = await this.findRow(me, person.id);

      if (!row) {
        throw error;
      }

      return { created: false, relation: await this.resolve(me, row) };
    }
  }

  /** The requests waiting for an answer from this person, and not the ones they sent. */
  async listRequests(me: string): Promise<FriendshipView[]> {
    const rows = await this.prisma.friendship.findMany({
      where: { ...this.eitherSide(me), status: PENDING, requestedById: { not: me } },
      include: withBothPeople,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.view(me, row));
  }

  /** The requests this person made that nobody has answered. */
  async listSent(me: string): Promise<FriendshipView[]> {
    const rows = await this.prisma.friendship.findMany({
      where: { ...this.eitherSide(me), status: PENDING, requestedById: me },
      include: withBothPeople,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.view(me, row));
  }

  /**
   * The people this person blocked, and never the people who blocked them: a block
   * must not announce itself, which is why this reads their own side of each row
   * rather than the status, and why nothing reads the other side for them.
   */
  async listBlocked(me: string): Promise<FriendshipView[]> {
    const rows = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { lowerUserId: me, blockedByLower: true },
          { higherUserId: me, blockedByHigher: true },
        ],
      },
      include: withBothPeople,
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => this.view(me, row));
  }

  /**
   * Agrees to a request somebody else made.
   *
   * A request one has sent oneself is not visible here at all: it answers 404 rather
   * than a refusal, because from this route's point of view there is nothing to accept.
   */
  async accept(me: string, username: string): Promise<FriendshipView> {
    const person = await this.users.findByUsername(username);
    const existing = await this.findRow(me, person.id);

    if (!existing || existing.status !== PENDING || existing.requestedById === me) {
      throw new NotFoundException('No request to accept');
    }

    return this.view(me, await this.markAccepted(existing.id));
  }

  /** The people who agreed, described as people rather than as records. */
  async list(me: string): Promise<FriendshipView[]> {
    const rows = await this.prisma.friendship.findMany({
      where: { ...this.eitherSide(me), status: ACCEPTED },
      include: withBothPeople,
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => this.view(me, row));
  }

  /**
   * Blocks somebody, whatever stood between the two before.
   *
   * An upsert rather than a check and a write: blocking has to work from any prior
   * state - friends, a request either way, or nothing at all - and all of them end
   * in the same row. `requestedById` on a block created from nothing names the
   * blocker, which is a formality: the column is only read while a row is pending.
   */
  async block(me: string, username: string): Promise<FriendshipView> {
    const person = await this.users.findByUsername(username);

    if (person.id === me) {
      throw new BadRequestException('You cannot block yourself');
    }

    const pair = pairOf(me, person.id);
    const { mine } = blockColumns(me, pair);
    const row = await this.prisma.friendship.upsert({
      where: { lowerUserId_higherUserId: pair },
      create: { ...pair, requestedById: me, status: BLOCKED, [mine]: true },
      // Only this person's side: the other's block, if there is one, stays theirs.
      update: { status: BLOCKED, [mine]: true },
      include: withBothPeople,
    });

    return this.view(me, row);
  }

  /**
   * Removes whatever relation exists.
   *
   * Declining a request, cancelling one you sent, unfriending and unblocking all
   * leave the same state - these two are not connected - so they are one operation
   * rather than four that happen to agree.
   */
  async remove(me: string, username: string): Promise<void> {
    const person = await this.users.findByUsername(username);
    const existing = await this.findRow(me, person.id);

    if (!existing) {
      throw new NotFoundException('No such relation');
    }

    if (existing.status === BLOCKED) {
      const { mine, theirs } = blockColumns(me, existing);

      // A blocked person must not be able to lift a block placed on them, or blocking
      // would be decorative. They are told what anybody blocked is told: nothing.
      if (!existing[mine]) {
        throw new NotFoundException('No such relation');
      }

      // Lifting your own block leaves theirs standing, so the row stays.
      if (existing[theirs]) {
        await this.prisma.friendship.update({
          where: { id: existing.id },
          data: { [mine]: false },
        });

        return;
      }
    }

    await this.prisma.friendship.delete({ where: { id: existing.id } });
  }

  /**
   * Whether this person has blocked that one. Only ever about their own block: nothing
   * here answers whether somebody has blocked them.
   */
  async hasBlocked(me: string, them: string): Promise<boolean> {
    const pair = pairOf(me, them);
    const { mine } = blockColumns(me, pair);

    return (await this.prisma.friendship.count({ where: { ...pair, [mine]: true } })) > 0;
  }

  /**
   * Whether these two are friends, which is the question the chat gateway asks in
   * `add-chat` before it lets a conversation exist.
   */
  async areFriends(a: string, b: string): Promise<boolean> {
    const count = await this.prisma.friendship.count({
      where: { ...pairOf(a, b), status: ACCEPTED },
    });

    return count > 0;
  }

  /** Matches a row from whichever side the person is on. */
  private eitherSide(me: string) {
    return { OR: [{ lowerUserId: me }, { higherUserId: me }] };
  }

  private async findRow(me: string, them: string): Promise<FriendshipRow | null> {
    return this.prisma.friendship.findUnique({
      where: { lowerUserId_higherUserId: pairOf(me, them) },
      include: withBothPeople,
    });
  }

  private markAccepted(id: string): Promise<FriendshipRow> {
    return this.prisma.friendship.update({
      where: { id },
      data: { status: ACCEPTED },
      include: withBothPeople,
    });
  }

  /** What asking again means, given what is already recorded about the two of them. */
  private async resolve(me: string, existing: FriendshipRow): Promise<FriendshipView> {
    if (existing.status === BLOCKED) {
      throw new NotFoundException('No such person');
    }

    // They asked first and now we have asked back, which is how one says yes.
    if (existing.status === PENDING && existing.requestedById !== me) {
      return this.view(me, await this.markAccepted(existing.id));
    }

    return this.view(me, existing);
  }

  private view(me: string, row: FriendshipRow): FriendshipView {
    return {
      user: row.lowerUserId === me ? row.higherUser : row.lowerUser,
      status: row.status,
      requestedByMe: row.requestedById === me,
    };
  }
}
