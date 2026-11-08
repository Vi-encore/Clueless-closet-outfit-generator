import type { PagedQuery, ShownPages } from './hooks.interfaces';

/**
 * What a list read a page at a time looks like on screen, from its infinite query.
 *
 * Everything that has arrived is shown as one list. A next page that failed leaves the
 * pages before it where they are, and only a first page that failed counts as an `error`,
 * so a screen that answers a 404 with "not found" does not do so halfway down a list.
 */
export function shownPages<T>(query: PagedQuery<T>): ShownPages<T> {
  const { data } = query;

  return {
    items: data?.pages.flatMap((page) => page.items) ?? [],
    hasMore: query.hasNextPage,
    failed: query.isError,
    error: data === undefined ? query.error : null,
    loading: query.isPending || query.isFetchingNextPage,
    more: () => {
      void query.fetchNextPage();
    },
  };
}
