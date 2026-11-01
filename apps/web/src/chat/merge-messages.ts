import type { ShownMessage } from './chat.interfaces';

/**
 * Adds messages to a conversation, or replaces the ones already there, by id.
 *
 * The one way a message reaches the screen, because the same message can come several
 * ways: as the acknowledgement, from the room, from the history, and when catching up.
 * Keyed by id it can arrive any number of times and be shown once. Sorted by time rather
 * than by arrival, because arrival order is whatever the network felt like.
 */
export function mergeMessages(shown: ShownMessage[], incoming: ShownMessage[]): ShownMessage[] {
  const byId = new Map(shown.map((message) => [message.id, message]));

  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return [...byId.values()].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
}
