import type { Page } from './api.interfaces';

/** The cursor for the page after this one, or nothing when this was the last. */
export function nextPage<T>(page: Page<T>): string | undefined {
  return page.nextCursor ?? undefined;
}
