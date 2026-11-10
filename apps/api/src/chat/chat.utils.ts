import { sortedPair } from '../sorted-pair.js';

/**
 * A room per person, besides the room per conversation.
 *
 * It is what lets a conversation created in the middle of a session reach
 * somebody who connected before that conversation existed: their sockets are
 * already gathered under their own name, so they can be pulled into the new
 * room without knowing which sockets they are. Live notifications will want
 * the same thing.
 */
export const userRoom = (userId: string): string => `user:${userId}`;

export const conversationRoom = (conversationId: string): string =>
  `conversation:${conversationId}`;

/** The pair as a Conversation stores it: one string, unique per pair. */
export function directKeyOf(x: string, y: string): string {
  return sortedPair(x, y).join(':');
}
