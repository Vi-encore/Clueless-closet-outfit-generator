import { sortedPair } from '../sorted-pair.js';

/** A room per conversation, which both people's connections join. */
export const conversationRoom = (conversationId: string): string =>
  `conversation:${conversationId}`;

/** The pair as a Conversation stores it: one string, unique per pair. */
export function directKeyOf(x: string, y: string): string {
  return sortedPair(x, y).join(':');
}
