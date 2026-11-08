import type { ReactNode } from 'react';
import type { Person } from '../../shared/api/api.interfaces';

/**
 * Where the connection stands. `lost` is a connection that had been up and went away,
 * kept apart from `connecting` because only the first is news to a person reading.
 */
export type ChatStatus = 'offline' | 'connecting' | 'connected' | 'lost';

export interface Chat {
  status: ChatStatus;
  /** Null until the list has arrived, which is different from there being none. */
  conversations: Conversation[] | null;
  failed: boolean;
  unreadTotal: number;
  send: (message: OutgoingMessage) => Promise<SendAck>;
  typing: (to: string) => void;
  /** Asks the API for the list again, after something here changed it. */
  refresh: () => void;
  /** Hears what happens on the connection. Returns the way to stop listening. */
  subscribe: (listener: ChatListener) => () => void;
}

/** What a screen can hear: a message, the line back after a drop, or somebody typing. */
export type ChatEvent =
  | { type: 'message'; message: Message }
  | { type: 'reconnected' }
  | { type: 'typing'; username: string };

export type ChatListener = (event: ChatEvent) => void;

/** A message on screen, and how far along it is. */
export interface ShownMessage extends Message {
  state: 'waiting' | 'sent' | 'failed';
}

/** One conversation, described by who is on the other side of it. */
export interface Conversation {
  id: string;
  user: Person;
  lastMessageAt: string | null;
  unread: number;
}

/** A message, as stored. Times are strings: `Date` does not survive JSON. */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

/** A message on its way out. The id is made by the client, so that a retry is safe. */
export interface OutgoingMessage {
  id: string;
  to: string;
  body: string;
}

/** What the gateway answers a `message:send` with. */
export type SendAck = { ok: true; message: Message } | { ok: false; error: string };

export interface ChatHandlers {
  /** The connection is up, for the first time or after a drop. */
  onConnected: () => void;
  /** It went away, and Socket.IO is trying to bring it back by itself. */
  onDisconnected: () => void;
  /**
   * The server refused the handshake, and nothing will try again by itself. Socket.IO
   * reconnects after a dropped line, because that is worth retrying. A refusal is an
   * answer, so it stops, and what happens next is the caller's decision.
   */
  onRefused: () => void;
  /** A message arrived, for any conversation this person is in. */
  onMessage: (message: Message) => void;
  /** Somebody is typing to this person. */
  onTyping: (username: string) => void;
}

export interface ChatConnection {
  /** Sends a message and answers with the gateway's acknowledgement, or rejects in time. */
  send: (message: OutgoingMessage) => Promise<SendAck>;
  /** Says this person is typing to that one. Lost without consequence if it is lost. */
  typing: (to: string) => void;
  /** Tries again after `onRefused`, reading the token afresh. */
  reconnect: () => void;
  close: () => void;
}

/** What the gateway says when somebody starts typing to this person. */
export interface TypingNotice {
  username: string;
}

export interface BubbleProps {
  message: ShownMessage;
  mine: boolean;
  onRetry: () => void;
}

export interface ChatProviderProps {
  children: ReactNode;
}

export interface UnreadBadgeProps {
  count: number;
}

export interface ConversationWindowProps {
  username: string;
}
