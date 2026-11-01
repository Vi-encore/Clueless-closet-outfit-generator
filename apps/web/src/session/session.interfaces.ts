import type { Account, Credentials, Registration } from '../api/api.interfaces';

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
