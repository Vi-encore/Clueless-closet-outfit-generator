import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AccountView } from '../auth/auth.service.js';
import { FriendsService } from '../friends/friends.service.js';
import { pageArgs, pageArgsAfter, toPage, type Page } from '../pagination.js';
import { isUniqueViolation } from '../prisma/errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortedPair } from '../sorted-pair.js';
import { UsersService } from '../users/users.service.js';
import type { ConversationView, MessageView, SentMessage } from './chat.interfaces.js';
import type { ListMessagesQuery } from './requests/list-messages.query.js';
import type { SendMessageRequest } from './requests/send-message.request.js';

const publicFields = { id: true, username: true, displayName: true } as const;

const messageFields = {
  id: true,
  conversationId: true,
  senderId: true,
  body: true,
  createdAt: true,
} as const;

/** The pair as a Conversation stores it: one string, unique per pair. */
function directKeyOf(x: string, y: string): string {
  return sortedPair(x, y).join(':');
}

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
    const recipient = await this.users.findByUsername(input.to);

    if (recipient.id === sender.id) {
      throw new BadRequestException('You cannot message yourself');
    }

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
            members: {
              where: { userId: { not: viewerId } },
              select: { user: { select: publicFields } },
            },
          },
        },
      },
    });

    // `flatMap` rather than a map and a filter: an empty array drops a row and a
    // single-element one keeps it, so no `null` is ever produced and nothing has
    // to be narrowed back out of the type afterwards.
    return rows.flatMap(({ conversation }) => {
      const other = conversation.members[0]?.user;

      // A conversation with nobody else in it cannot be described as one, and
      // should not exist: it is skipped rather than shown as half an entry.
      return other === undefined
        ? []
        : [{ id: conversation.id, user: other, lastMessageAt: conversation.lastMessageAt }];
    });
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
   * none yet. Refuses before saying anything at all about whether one exists.
   */
  private async readableConversation(viewerId: string, username: string): Promise<string | null> {
    const other = await this.users.findByUsername(username);

    if (other.id !== viewerId && !(await this.friends.areFriends(viewerId, other.id))) {
      throw new NotFoundException('No such person');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { directKey: directKeyOf(viewerId, other.id) },
      select: { id: true },
    });

    return conversation?.id ?? null;
  }

  /**
   * The conversation between two people, made now if it did not exist.
   *
   * The unique key means two first messages crossing cannot make two
   * conversations; the one that loses re-reads and uses the other's.
   */
  private async conversationWith(a: string, b: string): Promise<{ id: string; created: boolean }> {
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
