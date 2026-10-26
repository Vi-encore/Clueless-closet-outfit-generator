/**
 * A room per person, besides the room per conversation.
 *
 * It is what lets a conversation created in the middle of a session reach somebody
 * who connected before that conversation existed: their sockets are already
 * gathered under their own name, so they can be pulled into the new room without
 * knowing which sockets they are. Live notifications want the same thing later.
 */
export const userRoom = (userId: string): string => `user:${userId}`;

export const conversationRoom = (conversationId: string): string =>
  `conversation:${conversationId}`;
