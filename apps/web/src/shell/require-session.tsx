import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../session/use-session';

/** Where a guard interrupted somebody, carried in the location's state. */
interface Interrupted {
  from?: string;
}

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

/**
 * For signing in and registering, which mean nothing to somebody signed in. Drawing
 * nothing while the answer is unknown is what stops the form flashing at them.
 *
 * This is also what continues an interrupted journey. A screen here does nothing after
 * a successful sign-in: the state changes, this guard sees it and moves on, so the rule
 * lives in one place however a session comes to exist.
 */
export function RequireGuest() {
  const { state } = useSession();
  const location = useLocation();

  switch (state.status) {
    case 'unknown':
      return null;
    case 'signed-out':
      return <Outlet />;
    case 'signed-in':
      return <Navigate to={(location.state as Interrupted | null)?.from ?? '/'} replace />;
  }
}
