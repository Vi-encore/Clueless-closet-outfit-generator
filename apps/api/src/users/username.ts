import { z } from 'zod';

/**
 * The one definition of what a username is.
 *
 * It lives here rather than inside the sign-up request because two places need it to
 * agree: the route that creates a username and the route that looks one up. The
 * `.toLowerCase()` is what makes the second work - a name is stored lowercased, so a
 * lookup for `CHER` has to become `cher` before it reaches the database, and doing it
 * in the schema means no handler can forget.
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_]+$/, { error: 'Letters, digits and underscores only' });
