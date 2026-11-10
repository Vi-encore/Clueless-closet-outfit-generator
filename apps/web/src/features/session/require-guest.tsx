import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from './use-session';
import type { Interrupted } from './session.interfaces';

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
