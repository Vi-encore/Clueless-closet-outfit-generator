import type { ReactNode } from 'react';

/**
 * Three states, because a reload forgets the access token and only the API can say
 * whether there is still a session. With two, the application would start in the wrong
 * one: a sign-in screen flashed at somebody who is signed in, and a guard redirecting
 * away from the URL they asked for before anybody knew the answer.
 */
export type SessionState =
  { status: 'unknown' } | { status: 'signed-out' } | { status: 'signed-in'; account: Account };

export interface Session {
  state: SessionState;
  signIn: (credentials: Credentials) => Promise<void>;
  signUp: (registration: Registration) => Promise<void>;
  signOut: () => Promise<void>;
}

/** What the API says about an account: `AccountView` on its side. */
export interface Account {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration extends Credentials {
  username: string;
}

/** Where a guard interrupted somebody, carried in the location's state. */
export interface Interrupted {
  from?: string;
}

export interface SessionProviderProps {
  children: ReactNode;
}
