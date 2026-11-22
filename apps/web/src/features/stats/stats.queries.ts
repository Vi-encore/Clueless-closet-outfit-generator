import { queryOptions } from '@tanstack/react-query';
import { getSummary } from './stats.api';
import { statsKeys } from './stats.constants';

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
