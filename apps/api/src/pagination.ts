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

/** A slice of a list, and where the next one starts. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * The paging half of a `findMany`, newest first.
 *
 * `createdAt` alone is not a total order - two rows written in the same
 * millisecond can come back either way round, and a page boundary between them
 * would repeat one row or skip another. The id breaks the tie and is already
 * unique.
 *
 * `skip: 1` steps over the cursor row itself, which the previous page ended with.
 */
export function pageArgs(query: PageQuery) {
  return {
    orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
    // One more than asked for: if it comes back, there is another page. A `count`
    // would be a second round trip to answer a question nobody asked.
    take: query.limit + 1,
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  };
}

/** Turns the extra row `pageArgs` asked for into a cursor, and drops it. */
export function toPage<T extends { id: string }>(rows: T[], limit: number): Page<T> {
  const items = rows.slice(0, limit);

  return { items, nextCursor: rows.length > limit ? (items.at(-1)?.id ?? null) : null };
}
