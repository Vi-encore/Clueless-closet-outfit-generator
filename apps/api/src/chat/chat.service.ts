import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AccountView } from '../auth/auth.service.js';
import { FriendsService } from '../friends/friends.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import type { SendMessageRequest } from './requests/send-message.request.js';

/** What a message looks like to everybody who receives it. */
export interface MessageView {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: Date;
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
