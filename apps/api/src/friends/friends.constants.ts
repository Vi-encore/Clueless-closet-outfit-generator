import { Prisma } from '../generated/prisma/client.js';

export const PENDING = 'pending';

export const ACCEPTED = 'accepted';

export const BLOCKED = 'blocked';

export const publicFields = { id: true, username: true, displayName: true } as const;

export const withOtherUser = { otherUser: { select: publicFields } };

export type FriendshipRow = Prisma.FriendshipGetPayload<{ include: typeof withOtherUser }>;
