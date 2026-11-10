import { SLOTS, itemStatusSchema } from '@closet/core';
import { z } from 'zod';
import { pageQuerySchema } from '../../pagination.constants.js';

/**
 * What `GET /items` accepts.
 *
 * An absent `status` is not the same as "any status": the wardrobe a person means
 * when they ask for their wardrobe is the part of it they can still wear. Archived
 * items are reached by asking for them.
 */
export const listItemsQuerySchema = pageQuerySchema.extend({
  slot: z.enum(SLOTS).optional(),
  status: itemStatusSchema.optional(),
});

export type ListItemsQuery = z.infer<typeof listItemsQuerySchema>;
