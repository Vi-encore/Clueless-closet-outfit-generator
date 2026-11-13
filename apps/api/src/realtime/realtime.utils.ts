/**
 * A room per person, besides the chat's room per conversation.
 *
 * Every connection of a person joins it, so anything meant for them reaches each of
 * their devices: a conversation created in the middle of a session, and a change to
 * their relations.
 */
export const userRoom = (userId: string): string => `user:${userId}`;
