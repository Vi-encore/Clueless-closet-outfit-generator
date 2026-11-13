import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { listFriendItems } from '../wardrobe';
import { nextPage } from '../../shared/api/pages';
import { listBlocked, listFriends, listSentRequests, listWaitingRequests } from './friends.api';
import { friendKeys } from './friends.constants';

/** Every list of the friends screen, together, as that screen has always asked for them. */
export function peopleQuery() {
  return queryOptions({
    queryKey: friendKeys.all,
    queryFn: () =>
      Promise.all([listFriends(), listWaitingRequests(), listSentRequests(), listBlocked()]).then(
        ([friends, waiting, sent, blocked]) => ({ friends, waiting, sent, blocked }),
      ),
  });
}

/** The requests waiting for this person, alone, for a count where the whole screen is not. */
export function waitingRequestsQuery() {
  return queryOptions({
    queryKey: friendKeys.waiting(),
    queryFn: listWaitingRequests,
  });
}

/** What a friend marked for friends, a page at a time. */
export function friendWardrobeQuery(username: string) {
  return infiniteQueryOptions({
    queryKey: friendKeys.wardrobe(username),
    queryFn: ({ pageParam }) => listFriendItems({ username, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextPage,
  });
}
