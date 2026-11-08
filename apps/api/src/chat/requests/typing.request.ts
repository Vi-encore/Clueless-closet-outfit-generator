import { z } from 'zod';
import { usernameSchema } from '../../users/username.js';

/** Whom a person is typing to, named as a message's recipient is. */
export const typingRequestSchema = z.object({
  to: usernameSchema,
});
