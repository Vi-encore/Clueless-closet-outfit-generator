import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSession } from '../features/session';

/**
 * Empties the cache when a person's session ends, whether they signed out or the API
 * ended it, so that whoever signs in next in this tab starts from nothing.
 *
 * In the cleanup, which still sees the person who is leaving, and only when there was
 * one. The render that ends a session is the guard sending everybody to sign in, so no
 * screen is reading the cache as it empties, and the next person's screens mount only
 * after they have signed in. Emptying it as a session begins instead would pull queries
 * out from under screens that had just started them.
 *
 * It lives in `app/` because it joins two things the session feature should not have to
 * know about each other.
 */
export function ForgetBetweenPeople() {
  const { state } = useSession();
  const queryClient = useQueryClient();
  const accountId = state.status === 'signed-in' ? state.account.id : null;

  useEffect(() => {
    return () => {
      if (accountId !== null) {
        queryClient.clear();
      }
    };
  }, [accountId, queryClient]);

  return null;
}
