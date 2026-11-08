import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { listFriendItems } from '../wardrobe';
import { nextPage } from '../../shared/api/pages';
import { listBlocked, listFriends, listSentRequests, listWaitingRequests } from './friends.api';

/**
 * Where people live in the cache. A friend's wardrobe sits under `all` on purpose: a
 * relation that ends changes what their wardrobe answers, and refreshing `all` after any
 * change to a relation reaches it too.
 */
export const friendKeys = {
  all: ['friends'] as const,
  wardrobe: (username: string) => [...friendKeys.all, username, 'items'] as const,
};

/** Every list of the friends screen, together, as that screen has always asked for them. */
export const peopleQuery = queryOptions({
  queryKey: friendKeys.all,
  queryFn: () =>
    Promise.all([listFriends(), listWaitingRequests(), listSentRequests(), listBlocked()]).then(
      ([friends, waiting, sent, blocked]) => ({ friends, waiting, sent, blocked }),
    ),
});

/** What a friend marked for friends, a page at a time. */
export function friendWardrobeQuery(username: string) {
  return infiniteQueryOptions({
    queryKey: friendKeys.wardrobe(username),
    queryFn: ({ pageParam }) => listFriendItems({ username, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextPage,
  });
}
