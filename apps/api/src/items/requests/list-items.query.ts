import { SLOTS, itemStatusSchema } from '@closet/core';
import { z } from 'zod';

/** As many as a wardrobe screen can use at once, and as many as it may ask for. */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

/**
 * Where a page starts and how long it is.
 *
 * The cursor is an item's id rather than an encoded position: Prisma takes
 * `cursor: { id }` directly, so nothing has to be packed, passed around and parsed
 * back. What that needs in exchange is a total order on the rows - see `pageArgs`.
 */
export const pageQuerySchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PageQuery = z.infer<typeof pageQuerySchema>;

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
