import { z } from 'zod';

/** Long enough that guessing is hopeless, short enough that nobody hates us. */
export const MIN_PASSWORD_LENGTH = 10;

/**
 * What `POST /auth/sign-up` accepts.
 *
 * The username is lowercased before it is checked, so `Cher` and `cher` cannot both
 * exist - people are found by exact username, and two that differ only in case would
 * be a way to impersonate someone.
 */
export const signUpRequestSchema = z.object({
  email: z.email(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, { error: 'Letters, digits and underscores only' }),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(200),
  displayName: z.string().trim().min(1).max(80).optional(),
});

export type SignUpRequest = z.infer<typeof signUpRequestSchema>;
