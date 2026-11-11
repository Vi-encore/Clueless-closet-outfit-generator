import { uk } from '../../shared/i18n/uk';

/** `MIN_PASSWORD_LENGTH` on the API: the browser can say so before anything is sent. */
export const MIN_PASSWORD_LENGTH = 10;

/** `usernameSchema` on the API, which lowercases first, so either case is fine here. */
export const USERNAME = { minLength: 3, maxLength: 30, pattern: '[A-Za-z0-9_]+' } as const;

/** What each field has to be, said only about the fields the API refused. */
export const RULES = [
  ['email', uk.signUp.badEmail],
  ['username', uk.signUp.badUsername],
  ['password', uk.signUp.badPassword],
] as const;
