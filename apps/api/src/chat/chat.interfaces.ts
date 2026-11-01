import type { PublicUser } from '../users/users.service.js';

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
  /** Messages from the other person since this one last read the conversation. */
  unread: number;
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
