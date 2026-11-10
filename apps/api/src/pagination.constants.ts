import { z } from 'zod';

/** As many as one screen can use at once, and as many as it may ask for. */
export const DEFAULT_PAGE_SIZE = 50;

export const MAX_PAGE_SIZE = 100;

/**
 * Where a page starts and how long it is.
 *
 * The cursor is a row's own id rather than an encoded position: Prisma takes
 * `cursor: { id }` directly, so nothing has to be packed, passed around and parsed
 * back. What that needs in exchange is a total order - see `pageArgs`.
 */
export const pageQuerySchema = z.object({
  cursor: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export type PageQuery = z.infer<typeof pageQuerySchema>;
