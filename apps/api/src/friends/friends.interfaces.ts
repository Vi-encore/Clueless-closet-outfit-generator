import type { PublicUser } from '../users/users.interfaces.js';

/** One relation, described from the point of view of whoever asked about it. */
export interface FriendshipView {
  user: PublicUser;
  status: string;
  requestedByMe: boolean;
}

export interface RequestResult {
  created: boolean;
  relation: FriendshipView;
}

/** How `Friendship` spells a sorted pair: the smaller id first. */
export interface PairColumns {
  lowerUserId: string;
  higherUserId: string;
}
