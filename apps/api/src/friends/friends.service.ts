import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { isUniqueViolation } from '../prisma/errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortedPair } from '../sorted-pair.js';
import { UsersService } from '../users/users.service.js';
import type { FriendshipView, RequestResult } from './friends.interfaces.js';

export const PENDING = 'pending';
export const ACCEPTED = 'accepted';
export const BLOCKED = 'blocked';

const publicFields = { id: true, username: true, displayName: true } as const;
const withOtherUser = { otherUser: { select: publicFields } };

type FriendshipRow = Prisma.FriendshipGetPayload<{ include: typeof withOtherUser }>;

/** The unique key of the record one person holds about another. */
function sideOf(userId: string, otherUserId: string) {
  return { userId_otherUserId: { userId, otherUserId } };
}

/**
 * Friendships, requests and blocks.
 *
 * A relation between two people is two records, one held by each, and everything
 * here writes both or neither, in one transaction. Each person only ever reads their
 * own, which is how a block stays unannounced: it is a column on the blocker's record.
 */
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
      const mine = await this.onBothSides(
        me,
        person.id,
        this.prisma.friendship.create({
          data: { userId: me, otherUserId: person.id, requestedByMe: true },
          include: withOtherUser,
        }),
        this.prisma.friendship.create({ data: { userId: person.id, otherUserId: me } }),
      );

      return { created: true, relation: this.view(mine) };
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
      where: { userId: me, status: PENDING, requestedByMe: false },
      include: withOtherUser,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.view(row));
  }

  /** The requests this person made that nobody has answered. */
  async listSent(me: string): Promise<FriendshipView[]> {
    const rows = await this.prisma.friendship.findMany({
      where: { userId: me, status: PENDING, requestedByMe: true },
      include: withOtherUser,
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.view(row));
  }

  /**
   * The people this person blocked, and never the people who blocked them: a block
   * placed on somebody lives on the blocker's record, which they never read.
   */
  async listBlocked(me: string): Promise<FriendshipView[]> {
    const rows = await this.prisma.friendship.findMany({
      where: { userId: me, blocked: true },
      include: withOtherUser,
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => this.view(row));
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

    if (!existing || existing.status !== PENDING || existing.requestedByMe) {
      throw new NotFoundException('No request to accept');
    }

    return this.view(await this.markAccepted(me, person.id));
  }

  /** The people who agreed, described as people rather than as records. */
  async list(me: string): Promise<FriendshipView[]> {
    const rows = await this.prisma.friendship.findMany({
      where: { userId: me, status: ACCEPTED },
      include: withOtherUser,
      orderBy: { updatedAt: 'desc' },
    });

    return rows.map((row) => this.view(row));
  }

  /**
   * Blocks somebody, whatever stood between the two before.
   *
   * Upserts rather than a check and a write: blocking has to work from any prior
   * state - friends, a request either way, or nothing at all - and all of them end
   * in the same two records. Only this person's record says it blocked; the other's
   * own block, if there is one, stays theirs. `requestedByMe` on a block created from
   * nothing is a formality: it is only read while a relation is pending.
   */
  async block(me: string, username: string): Promise<FriendshipView> {
    const person = await this.users.findByUsername(username);

    if (person.id === me) {
      throw new BadRequestException('You cannot block yourself');
    }

    const mine = await this.onBothSides(
      me,
      person.id,
      this.prisma.friendship.upsert({
        where: sideOf(me, person.id),
        create: {
          userId: me,
          otherUserId: person.id,
          requestedByMe: true,
          status: BLOCKED,
          blocked: true,
        },
        update: { status: BLOCKED, blocked: true },
        include: withOtherUser,
      }),
      this.prisma.friendship.upsert({
        where: sideOf(person.id, me),
        create: { userId: person.id, otherUserId: me, status: BLOCKED },
        update: { status: BLOCKED },
      }),
    );

    return this.view(mine);
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
      // A blocked person must not be able to lift a block placed on them, or blocking
      // would be decorative. They are told what anybody blocked is told: nothing.
      if (!existing.blocked) {
        throw new NotFoundException('No such relation');
      }

      // Lifting your own block leaves theirs standing, so both records stay.
      if (await this.hasBlocked(person.id, me)) {
        await this.prisma.friendship.update({
          where: sideOf(me, person.id),
          data: { blocked: false },
        });

        return;
      }
    }

    await this.onBothSides(
      me,
      person.id,
      this.prisma.friendship.deleteMany({ where: { userId: me, otherUserId: person.id } }),
      this.prisma.friendship.deleteMany({ where: { userId: person.id, otherUserId: me } }),
    );
  }

  /**
   * Whether this person has blocked that one. Only ever about their own block: nothing
   * a person can call answers whether somebody has blocked them.
   */
  async hasBlocked(me: string, them: string): Promise<boolean> {
    const count = await this.prisma.friendship.count({
      where: { userId: me, otherUserId: them, blocked: true },
    });

    return count > 0;
  }

  /** Whether these two are friends, which the chat asks before a message and items before sharing. */
  async areFriends(a: string, b: string): Promise<boolean> {
    const count = await this.prisma.friendship.count({
      where: { userId: a, otherUserId: b, status: ACCEPTED },
    });

    return count > 0;
  }

  private findRow(me: string, them: string): Promise<FriendshipRow | null> {
    return this.prisma.friendship.findUnique({ where: sideOf(me, them), include: withOtherUser });
  }

  private markAccepted(me: string, them: string): Promise<FriendshipRow> {
    return this.onBothSides(
      me,
      them,
      this.prisma.friendship.update({
        where: sideOf(me, them),
        data: { status: ACCEPTED },
        include: withOtherUser,
      }),
      this.prisma.friendship.update({ where: sideOf(them, me), data: { status: ACCEPTED } }),
    );
  }

  /**
   * One write on each side, in one transaction, and what the first of them returned.
   *
   * The side held by whichever id sorts first is written first. Two people acting on
   * the same relation at once then reach its rows in the same order, so one waits for
   * the other. In opposite orders each would hold the row the other wants next, and
   * PostgreSQL would end one with a deadlock rather than the unique violation that
   * `request` knows how to answer.
   */
  private async onBothSides<T>(
    me: string,
    them: string,
    mine: Prisma.PrismaPromise<T>,
    theirs: Prisma.PrismaPromise<unknown>,
  ): Promise<T> {
    const [first] = sortedPair(me, them);

    if (first === me) {
      const [result] = await this.prisma.$transaction([mine, theirs]);

      return result;
    }

    const [, result] = await this.prisma.$transaction([theirs, mine]);

    return result;
  }

  /** What asking again means, given what is already recorded about the two of them. */
  private async resolve(me: string, existing: FriendshipRow): Promise<FriendshipView> {
    if (existing.status === BLOCKED) {
      throw new NotFoundException('No such person');
    }

    // They asked first and now we have asked back, which is how one says yes.
    if (existing.status === PENDING && !existing.requestedByMe) {
      return this.view(await this.markAccepted(me, existing.otherUserId));
    }

    return this.view(existing);
  }

  private view(row: FriendshipRow): FriendshipView {
    return {
      user: row.otherUser,
      status: row.status,
      requestedByMe: row.requestedByMe,
    };
  }
}
