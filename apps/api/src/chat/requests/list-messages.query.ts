import { z } from 'zod';
import { pageQuerySchema } from '../../pagination.constants.js';

/**
 * What the history route accepts.
 *
 * `cursor` walks backwards into what has already been said; `after` walks
 * forwards from something the client already has. They are opposite directions
 * on one ordered list, so asking for both at once means nothing and is refused
 * rather than silently resolved one way.
 */
export const listMessagesQuerySchema = pageQuerySchema
  .extend({ after: z.uuid().optional() })
  .refine((query) => query.after === undefined || query.cursor === undefined, {
    error: 'Ask for older or for newer, not both',
    path: ['after'],
  });

export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
