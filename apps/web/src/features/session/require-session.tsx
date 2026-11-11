import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from './use-session';
import type { Interrupted } from './session.interfaces';

/**
 * For the screens that need a session. Sends everybody else to sign in, remembering
 * where they were going. Waits while the answer is unknown, so that somebody who is
 * signed in never sees the address bar bounce through a screen they do not need.
 */
export function RequireSession() {
  const { state } = useSession();
  const { pathname, search, hash } = useLocation();

  switch (state.status) {
    case 'unknown':
      return null;
    case 'signed-out':
      return (
        <Navigate to="/sign-in" replace state={{ from: pathname + search + hash } as Interrupted} />
      );
    case 'signed-in':
      return <Outlet />;
  }
}
