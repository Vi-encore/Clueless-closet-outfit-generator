import { useEffect, useMemo, useState, type ReactNode } from 'react';
import * as auth from '../api/auth';
import { onSessionLost, renewAccessToken } from '../shared/api/client';
import type { Credentials, Registration } from '../api/api.interfaces';
import { setAccessToken } from '../shared/api/token-store';
import { SessionContext } from './session.context';
import type { Session, SessionState } from './session.interfaces';

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'unknown' });

  useEffect(() => {
    let current = true;
    const settle = (next: SessionState) => {
      if (current) {
        setState(next);
      }
    };

    // Whatever went wrong, the answer on screen is the sign-in form: a failure here that
    // was not a refusal, such as the API being down, leaves the cookie as it was, and
    // the next reload gets the session back.
    renewAccessToken()
      .then(auth.currentAccount)
      .then(
        (account) => settle({ status: 'signed-in', account }),
        () => settle({ status: 'signed-out' }),
      );

    return () => {
      current = false;
    };
  }, []);

  useEffect(() => onSessionLost(() => setState({ status: 'signed-out' })), []);

  const session = useMemo<Session>(() => {
    const signIn = async (credentials: Credentials) => {
      await auth.signIn(credentials);
      setState({ status: 'signed-in', account: await auth.currentAccount() });
    };

    return {
      state,
      signIn,
      // The API creates an account and starts no session, so one is started here: nobody
      // who has just chosen a password should be asked for it again.
      signUp: async (registration: Registration) => {
        await auth.signUp(registration);
        await signIn(registration);
      },
      signOut: async () => {
        try {
          await auth.signOut();
        } finally {
          // Even if the API could not be reached. Whoever pressed the button is leaving,
          // possibly from somebody else's computer, and that does not wait for a network.
          setAccessToken(null);
          setState({ status: 'signed-out' });
        }
      },
    };
  }, [state]);

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}
