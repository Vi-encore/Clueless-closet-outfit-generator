import type { Page, PageArgs } from './pagination.interfaces.js';
import { PageQuery } from './pagination.constants.js';

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
export function pageArgs(query: PageQuery): PageArgs {
  return {
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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

/**
 * The same walk, the other way: everything newer than a row the caller has.
 *
 * This is what a client returning from a dropped connection asks for - it knows
 * the last thing it saw and wants what came after, oldest first, so it can
 * append rather than reorder.
 *
 * An anchor from somewhere else does no harm: the `where` clause bounds what can
 * come back whatever the cursor points at, so the worst case is an empty page.
 */
export function pageArgsAfter(anchorId: string, limit: number): PageArgs {
  return {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: limit + 1,
    cursor: { id: anchorId },
    skip: 1,
  };
}
