import { z } from 'zod';
import { emailSchema } from './email.js';

/**
 * No length or shape rules here beyond "present". Rejecting a short password at
 * sign-in would tell an attacker that short passwords are impossible, and an account
 * made before a rule changed still has to be able to get in.
 */
export const signInRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export type SignInRequest = z.infer<typeof signInRequestSchema>;
