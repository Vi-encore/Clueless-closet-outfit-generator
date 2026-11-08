import type { PublicUser } from '../users/users.interfaces.js';

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

/**
 * What the sender's callback is handed, always.
 *
 * A refusal travels in the acknowledgement rather than as an `exception` event,
 * which is why the payload is checked inside the handler instead of by the global
 * pipe: a pipe runs before the handler and its failure would escape the callback,
 * leaving the client to race an acknowledgement against an event. The sender
 * passed one callback and learns the fate of their message in it.
 */
export type SendAck = { ok: true; message: MessageView } | { ok: false; error: string };

/** One row of the unread count: a conversation, and how much in it is new to this person. */
export interface UnreadRow {
  conversationId: string;
  unread: number;
}

/** A conversation between two people, and whether asking for it is what made it. */
export interface FoundConversation {
  id: string;
  created: boolean;
}
