import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FriendsService } from '../friends/friends.service.js';
import { pageArgs, pageArgsAfter, toPage } from '../pagination.js';
import { isUniqueViolation } from '../prisma/errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import type {
  ConversationView,
  FoundConversation,
  MessageView,
  SentMessage,
  UnreadRow,
} from './chat.interfaces.js';
import type { ListMessagesQuery } from './requests/list-messages.query.js';
import type { SendMessageRequest } from './requests/send-message.request.js';
import type { Page } from '../pagination.interfaces.js';
import type { AccountView } from '../auth/auth.interfaces.js';
import type { PublicUser } from '../users/users.interfaces.js';
import { messageFields, publicFields } from './chat.constants.js';
import { directKeyOf } from './chat.utils.js';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly friends: FriendsService,
    private readonly users: UsersService,
  ) {}

  /** The conversations a person is in, which is what their socket joins on connect. */
  async conversationIdsOf(userId: string): Promise<string[]> {
    const rows = await this.prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    return rows.map((row) => row.conversationId);
  }

  /**
   * Stores a message to a friend, making the conversation if there is none yet.
   *
   * Friendship is checked on every message rather than once at the beginning.
   * Checking only at the start would let somebody keep writing after being
   * blocked, and blocking exists to stop exactly that - while `areFriends`
   * already answers false for a blocked pair, so this needs no idea what
   * blocking is.
   */
  async send(sender: AccountView, input: SendMessageRequest): Promise<SentMessage> {
    const recipient = await this.somebodyElse(sender.id, input.to);

    if (!(await this.friends.areFriends(sender.id, recipient.id))) {
      // The same answer whether they were never friends, no longer are, or have
      // blocked the sender: a refusal that explained itself would announce a block.
      throw new NotFoundException('No such person');
    }

    const conversation = await this.conversationWith(sender.id, recipient.id);
    const message = await this.store(input, conversation.id, sender.id);

    return {
      message,
      conversationId: conversation.id,
      senderId: sender.id,
      recipientId: recipient.id,
      conversationCreated: conversation.created,
    };
  }

  /** The conversations this person is in, each named by who else is in it. */
  async conversationsOf(viewerId: string): Promise<ConversationView[]> {
    const rows = await this.prisma.conversationMember.findMany({
      where: { userId: viewerId },
      // Ordered here rather than afterwards. The conversation carries the moment
      // of its newest message, so no message has to be fetched to find it out,
      // and nothing is sorted twice.
      orderBy: { conversation: { lastMessageAt: { sort: 'desc', nulls: 'last' } } },
      select: {
        conversation: {
          select: {
            id: true,
            lastMessageAt: true,
            // Everybody but the viewer. For a direct conversation that is one
            // person; the shape already allows for the groups that come later.
            // Only somebody whose history the viewer may read, by the rule
            // `readableConversation` uses, so that an entry never opens onto a 404.
            // A conversation here already exists, so that rule comes down to this:
            // the viewer blocked them, or they have not blocked the viewer.
            members: {
              where: {
                userId: { not: viewerId },
                user: {
                  OR: [
                    { friendshipsAboutMe: { some: { userId: viewerId, blocked: true } } },
                    { friendships: { none: { otherUserId: viewerId, blocked: true } } },
                  ],
                },
              },
              select: { user: { select: publicFields } },
            },
          },
        },
      },
    });

    const unread = await this.unreadCounts(viewerId);

    // `flatMap` rather than a map and a filter: an empty array drops a row and a
    // single-element one keeps it, so no `null` is ever produced and nothing has
    // to be narrowed back out of the type afterwards.
    return rows.flatMap(({ conversation }) => {
      const other = conversation.members[0]?.user;

      // A conversation with nobody else in it cannot be described as one: it is
      // skipped rather than shown as half an entry. That is also how one with
      // somebody the viewer may no longer read leaves the list, without being deleted.
      return other === undefined
        ? []
        : [
            {
              id: conversation.id,
              user: other,
              lastMessageAt: conversation.lastMessageAt,
              unread: unread.get(conversation.id) ?? 0,
            },
          ];
    });
  }

  /**
   * How many messages each conversation holds that this person has not read.
   *
   * One statement for the whole list rather than a count per conversation, which is
   * the shape `lastMessageAt` was added to get rid of. Raw, because Prisma cannot compare
   * a column with one on another table inside a filter. A null `lastReadAt` means they
   * have never read it, so everything from the other person counts.
   */
  private async unreadCounts(viewerId: string): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRaw<UnreadRow[]>`
      SELECT m."conversationId", COUNT(*)::int AS unread
      FROM "Message" m
      JOIN "ConversationMember" me
        ON me."conversationId" = m."conversationId" AND me."userId" = ${viewerId}::uuid
      WHERE m."senderId" <> ${viewerId}::uuid
        AND (me."lastReadAt" IS NULL OR m."createdAt" > me."lastReadAt")
      GROUP BY m."conversationId"
    `;

    return new Map(rows.map((row) => [row.conversationId, row.unread]));
  }

  /**
   * Records that this person has read the conversation up to now, and only this person:
   * the other one's count is theirs. Friends with nothing said yet have nothing to mark,
   * which is not a failure.
   */
  async markRead(viewerId: string, username: string): Promise<void> {
    const conversationId = await this.readableConversation(viewerId, username);

    if (conversationId !== null) {
      await this.prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId, userId: viewerId } },
        data: { lastReadAt: new Date() },
      });
    }
  }

  /**
   * Whom a `typing` event may reach, or null for nobody.
   *
   * Checked on each event, like a message, so that blocking stops this too. Null rather
   * than a refusal, for somebody unknown as for a stranger: nothing depends on this
   * arriving, and an answer would tell a stranger whether a name exists.
   */
  async typingTo(senderId: string, username: string): Promise<string | null> {
    const person = await this.users.findByUsername(username).catch(() => null);

    return person !== null && (await this.friends.areFriends(senderId, person.id))
      ? person.id
      : null;
  }

  /**
   * One conversation's messages, newest first.
   *
   * Friends who have said nothing get an empty page rather than a 404: the
   * conversation does not exist yet, which is not the same as being refused.
   */
  async historyWith(
    viewerId: string,
    username: string,
    query: ListMessagesQuery,
  ): Promise<Page<MessageView>> {
    const conversationId = await this.readableConversation(viewerId, username);

    if (conversationId === null) {
      return { items: [], nextCursor: null };
    }

    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      select: messageFields,
      // Reading back and catching up are one list walked two ways; only the
      // direction and where the walk starts differ.
      ...(query.after === undefined ? pageArgs(query) : pageArgsAfter(query.after, query.limit)),
    });

    return toPage(rows, query.limit);
  }

  /**
   * The conversation this person may read with that one, or null if there is
   * none yet.
   *
   * Friends may read it, said or not. So may somebody who blocked, since what was said
   * stays theirs, and a former friend, for the same reason - but only where something
   * was said, because a stranger has nothing to read. The one place it is closed is to
   * the person blocked: they get the 404 a stranger gets, as anything else would
   * announce the block. Only a conversation between friends is ever made, so one that
   * exists between two people who are not friends now is exactly a former friend's.
   */
  private async readableConversation(viewerId: string, username: string): Promise<string | null> {
    const other = await this.somebodyElse(viewerId, username);
    const conversation = await this.prisma.conversation.findUnique({
      where: { directKey: directKeyOf(viewerId, other.id) },
      select: { id: true },
    });

    const allowed =
      (await this.friends.areFriends(viewerId, other.id)) ||
      (await this.friends.hasBlocked(viewerId, other.id)) ||
      (conversation !== null && !(await this.friends.hasBlocked(other.id, viewerId)));

    if (!allowed) {
      throw new NotFoundException('No such person');
    }

    return conversation?.id ?? null;
  }

  /**
   * The person a conversation would be with, who is never the one asking.
   *
   * Nobody has a conversation with themselves, so their own name is answered as a
   * stranger's is: there is no such person to talk to. Checked here, beside the lookup,
   * so that reading and writing cannot disagree about it again.
   */
  private async somebodyElse(viewerId: string, username: string): Promise<PublicUser> {
    const person = await this.users.findByUsername(username);

    if (person.id === viewerId) {
      throw new NotFoundException('No such person');
    }

    return person;
  }

  /**
   * The conversation between two people, made now if it did not exist.
   *
   * The unique key means two first messages crossing cannot make two
   * conversations; the one that loses re-reads and uses the other's.
   */
  private async conversationWith(a: string, b: string): Promise<FoundConversation> {
    const directKey = directKeyOf(a, b);
    const existing = await this.prisma.conversation.findUnique({
      where: { directKey },
      select: { id: true },
    });

    if (existing) {
      return { id: existing.id, created: false };
    }

    try {
      const made = await this.prisma.conversation.create({
        data: { directKey, members: { create: [{ userId: a }, { userId: b }] } },
        select: { id: true },
      });

      return { id: made.id, created: true };
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      // Their first message landed between our read and our write.
      const found = await this.prisma.conversation.findUniqueOrThrow({
        where: { directKey },
        select: { id: true },
      });

      return { id: found.id, created: false };
    }
  }

  /**
   * Writes the message, or answers with the one already stored under that id.
   *
   * The re-read is scoped to this sender and this conversation, and that is not
   * tidiness. An unscoped lookup by id would hand somebody else's message to
   * anybody who sent a `message:send` carrying a guessed id - turning a retry
   * mechanism into a way of reading other people's conversations.
   */
  private async store(
    input: SendMessageRequest,
    conversationId: string,
    senderId: string,
  ): Promise<MessageView> {
    // One moment for both writes rather than two "now"s a millisecond apart,
    // so the conversation's `lastMessageAt` is exactly its newest message's time.
    const createdAt = new Date();

    try {
      // A transaction, because the two have to agree: a message stored without
      // its conversation's clock moving would sit in a list that never rose.
      const [created] = await this.prisma.$transaction([
        this.prisma.message.create({
          data: { id: input.id, conversationId, senderId, body: input.body, createdAt },
          select: messageFields,
        }),
        this.prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: createdAt },
        }),
      ]);

      return created;
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      const theirs = await this.prisma.message.findFirst({
        where: { id: input.id, conversationId, senderId },
        select: messageFields,
      });

      if (!theirs) {
        throw new BadRequestException('That message id is already in use');
      }

      return theirs;
    }
  }
}
