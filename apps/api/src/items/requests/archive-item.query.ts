import { archiveReasonSchema } from '@closet/core';
import { z } from 'zod';

/**
 * What `DELETE /items/:id` accepts.
 *
 * The reason travels in the query rather than a body: a `DELETE` with a body is
 * allowed but badly served - proxies and clients drop it - and this is one scalar.
 *
 * It is optional, and an absent reason is not `other`. "Not said" and "none of these
 * fit" are different answers, and the statistics in step 13 will want to tell them
 * apart rather than count silence as a choice.
 */
export const archiveItemQuerySchema = z.object({
  reason: archiveReasonSchema.optional(),
});

export type ArchiveItemQuery = z.infer<typeof archiveItemQuerySchema>;
