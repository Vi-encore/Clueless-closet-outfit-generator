import { useQuery } from '@tanstack/react-query';
import { waitingRequestsQuery } from './friends.queries';

/**
 * How many requests are waiting for this person, for the desktop. One list rather than
 * the friends screen's four, and under the same key as they are, so that a change the
 * live connection announces refreshes it too.
 */
export function useWaitingRequestCount(): number {
  return useQuery(waitingRequestsQuery()).data?.length ?? 0;
}
