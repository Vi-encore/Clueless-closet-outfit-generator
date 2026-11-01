import type { Conversation, Message, OutgoingMessage, SendAck } from '../api/api.interfaces';

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
