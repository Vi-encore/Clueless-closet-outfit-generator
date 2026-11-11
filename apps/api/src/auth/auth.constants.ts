import { hash } from '@node-rs/argon2';

/** The cookie the refresh token travels in, and the only path that ever receives it. */
export const REFRESH_COOKIE = 'refresh_token';

export const REFRESH_PATH = '/auth/refresh';

export const IS_PUBLIC = 'auth:public';

/** The columns an account is described by. The hash is not among them. */
export const accountFields = {
  id: true,
  email: true,
  username: true,
  displayName: true,
} as const;

/**
 * A real argon2 hash of a value nobody will ever send, computed once.
 *
 * Signing in with an unknown email verifies against this instead of returning early.
 * Without it, "no such account" would answer in a millisecond while a wrong password
 * took a hundred, and the difference alone would say whether an address is registered.
 */
export const absentAccountHash = hash('no account has this password');
