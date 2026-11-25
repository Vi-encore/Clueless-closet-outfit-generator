import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { nextPage } from '../../shared/api/pages';
import { getSummary, getUnworn } from './stats.api';
import { statsKeys } from './stats.constants';
import type { UnwornLine } from './stats.interfaces';

/**
 * Shorter than the life of the photo links the statistics carry, so the screen opened
 * again much later asks again rather than drawing pictures that stopped loading.
 */
const FRESH_FOR = 60_000;

export function summaryQuery() {
  return queryOptions({
    queryKey: statsKeys.summary(),
    queryFn: getSummary,
    staleTime: FRESH_FOR,
  });
}

/** The items not worn for `days`, a page at a time. */
export function unwornQuery(days: string) {
  return infiniteQueryOptions({
    queryKey: statsKeys.unworn(days),
    queryFn: ({ pageParam }) => getUnworn(days, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextPage<UnwornLine>,
    staleTime: FRESH_FOR,
  });
}
