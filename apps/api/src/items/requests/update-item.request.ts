import { z } from 'zod';
import { createItemRequestSchema } from './create-item.request.js';

/**
 * What `PATCH /items/:id` accepts: the create request with every field optional.
 *
 * Built from `.shape` rather than by calling `.partial()` on the create schema, and
 * the difference is the whole point. `createItemRequestSchema` carries the slot/type
 * refinement, and `.partial()` would keep it - leaving a rule that needs both fields
 * to judge a body that is allowed to carry one. Rebuilding from the same field
 * schemas keeps every vocabulary and drops the cross-field check, which the service
 * then applies to the merged item instead.
 */
export const updateItemRequestSchema = z
  .object(createItemRequestSchema.shape)
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, {
    error: 'Give at least one tag to change',
  });

export type UpdateItemRequest = z.infer<typeof updateItemRequestSchema>;
