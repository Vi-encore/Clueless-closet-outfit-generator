import { useContext } from 'react';
import { SessionContext } from './session.context';
import type { Session } from './session.interfaces';

export function useSession(): Session {
  const session = useContext(SessionContext);

  if (session === null) {
    throw new Error('useSession needs a SessionProvider above it');
  }

  return session;
}
