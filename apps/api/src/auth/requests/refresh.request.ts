import { z } from 'zod';

/**
 * The token is optional here because it usually arrives in a cookie. A native
 * client has no cookie jar and keeps it in the device's secure storage, so it sends
 * the token in the body instead - the one shape both kinds of client can use.
 */
export const refreshRequestSchema = z
  .object({
    refreshToken: z.string().min(1).optional(),
  })
  // `.default({})` matters more than it looks: a browser refreshing with nothing but
  // the cookie sends no body at all, and without this the request would be rejected
  // as invalid before anyone looked at the cookie.
  .default({});

export type RefreshRequest = z.infer<typeof refreshRequestSchema>;
