import { z } from 'zod';
import { usernameSchema } from '../../users/username.js';

/**
 * What `message:send` carries.
 *
 * The id comes from the client. A socket can drop between the server storing a
 * message and the acknowledgement arriving, and an honest client resends; without
 * an id of its own that resend would be a second message.
 */
export const sendMessageRequestSchema = z.object({
  id: z.uuid(),
  to: usernameSchema,
  body: z.string().trim().min(1).max(4000),
});

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;
