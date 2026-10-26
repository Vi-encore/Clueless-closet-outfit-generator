import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AccountView } from '../auth/auth.service.js';
import { FriendsService } from '../friends/friends.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { pageArgs, toPage, type Page, type PageQuery } from '../pagination.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService, type PublicUser } from '../users/users.service.js';
import type { SendMessageRequest } from './requests/send-message.request.js';

/** What a message looks like to everybody who receives it. */
export interface MessageView {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
}

/** One conversation, described by the person on the other side of it. */
export interface ConversationView {
  id: string;
  user: PublicUser;
  lastMessageAt: Date | null;
}

/** A stored message, and what the gateway needs in order to deliver it. */
export interface SentMessage {
  message: MessageView;
  conversationId: string;
  senderId: string;
  recipientId: string;
  /** True when this message brought the conversation into being. */
  conversationCreated: boolean;
}

const publicFields = { id: true, username: true, displayName: true } as const;

const messageFields = {
  id: true,
  conversationId: true,
  senderId: true,
  body: true,
  createdAt: true,
} as const;

/** The two ids sorted and joined, which is what makes one pair one conversation. */
function directKeyOf(x: string, y: string): string {
  return x < y ? `${x}:${y}` : `${y}:${x}`;
}

/** PostgreSQL's unique violation, as Prisma reports it. */
function isAlreadyThere(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
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
      select: {
        conversation: {
          select: {
            id: true,
            // Everybody but the viewer. For a direct conversation that is one
            // person; the shape already allows for the groups that come later.
            members: {
              where: { userId: { not: viewerId } },
              select: { user: { select: publicFields } },
            },
            messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } },
          },
        },
      },
    });

    return rows
      .map(({ conversation }): ConversationView | null => {
        const other = conversation.members[0]?.user;

        // A conversation with nobody else in it cannot be described as one, and
        // should not exist: it is skipped rather than shown as half an entry.
        return other === undefined
          ? null
          : {
              id: conversation.id,
              user: other,
              lastMessageAt: conversation.messages[0]?.createdAt ?? null,
            };
      })
      .filter((view): view is ConversationView => view !== null)
      .sort((a, b) => (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0));
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
    query: PageQuery,
  ): Promise<Page<MessageView>> {
    const conversationId = await this.readableConversation(viewerId, username);

    if (conversationId === null) {
      return { items: [], nextCursor: null };
    }

    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      select: messageFields,
      ...pageArgs(query),
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
      if (!isAlreadyThere(error)) {
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
    try {
      return await this.prisma.message.create({
        data: { id: input.id, conversationId, senderId, body: input.body },
        select: messageFields,
      });
    } catch (error) {
      if (!isAlreadyThere(error)) {
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
