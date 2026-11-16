import { hasStatus } from '../../shared/api/api.utils';
import { uk } from '../../shared/i18n/uk';

export function describeAskFailure(error: unknown): string {
  // Unknown, or the person has blocked this one: the API answers both with 404 on
  // purpose, and a more helpful message here would quietly undo that. A name that could
  // not exist answers 400, and to the person typing it is the same thing.
  return hasStatus(error, 404) || hasStatus(error, 400) ? uk.friends.nobody : uk.errors.unavailable;
}

/** A link that opens this person's friends screen with an offer to ask `username`. */
export function inviteLinkFor(username: string, origin: string): string {
  return `${origin}/friends?add=${encodeURIComponent(username)}`;
}
