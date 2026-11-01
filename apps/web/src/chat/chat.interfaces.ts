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
  /** Asks the API for the list again, after something here changed it. */
  refresh: () => void;
}

/** A message on screen, and how far along it is. */
export interface ShownMessage extends Message {
  state: 'waiting' | 'sent' | 'failed';
}
