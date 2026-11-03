import type { Person } from './api/api.interfaces';

/** What to call somebody: sign-up does not ask for a display name, so many have none. */
export function personName({ displayName, username }: Person): string {
  return displayName ?? username;
}
