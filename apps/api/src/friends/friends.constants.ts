import { Prisma } from '../generated/prisma/client.js';

export const PENDING = 'pending';

export const ACCEPTED = 'accepted';

export const BLOCKED = 'blocked';

export const publicFields = { id: true, username: true, displayName: true } as const;

export const withOtherUser = { otherUser: { select: publicFields } };

export type FriendshipRow = Prisma.FriendshipGetPayload<{ include: typeof withOtherUser }>;

/**
 * Sent on the live connection when a person's relations change. It carries nothing: the
 * client asks for its own lists again, which say no more than they already would.
 */
export const FRIENDS_CHANGED = 'friends:changed';
