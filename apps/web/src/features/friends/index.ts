/**
 * What the rest of the client may use of friends. The chat asks who is a friend and who is
 * blocked, and refreshes the people when the live connection says they changed.
 */
export { FriendWardrobe } from './friend-wardrobe';
export { Friends } from './friends';
export { listBlocked, listFriends } from './friends.api';
export { friendKeys } from './friends.constants';
export { useWaitingRequestCount } from './use-waiting-request-count';
export type { Relation } from './friends.interfaces';
