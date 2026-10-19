import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService, type PublicUser } from '../users/users.service.js';

export const PENDING = 'pending';
export const ACCEPTED = 'accepted';
export const BLOCKED = 'blocked';

/** One relation, described from the point of view of whoever asked about it. */
export interface FriendshipView {
  user: PublicUser;
  status: string;
  requestedByMe: boolean;
}

export interface RequestResult {
  created: boolean;
  relation: FriendshipView;
}

const publicFields = { id: true, username: true, displayName: true } as const;
const withBothPeople = { userA: { select: publicFields }, userB: { select: publicFields } };

type FriendshipRow = Prisma.FriendshipGetPayload<{ include: typeof withBothPeople }>;

/**
 * The pair as the table stores it: the two ids sorted, smaller first.
 *
 * Every query and every write goes through this, which is what makes the unique
 * index mean "one relationship between these two people" rather than "one in this
 * direction".
 */
function pairOf(x: string, y: string): { userAId: string; userBId: string } {
  return x < y ? { userAId: x, userBId: y } : { userAId: y, userBId: x };
}

/** PostgreSQL's unique violation, as Prisma reports it. */
function isAlreadyThere(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
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
      if (!isAlreadyThere(error)) {
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
    return { OR: [{ userAId: me }, { userBId: me }] };
  }

  private async findRow(me: string, them: string): Promise<FriendshipRow | null> {
    return this.prisma.friendship.findUnique({
      where: { userAId_userBId: pairOf(me, them) },
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
      user: row.userAId === me ? row.userB : row.userA,
      status: row.status,
      requestedByMe: row.requestedById === me,
    };
  }
}
