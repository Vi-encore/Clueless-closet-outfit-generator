import { queryOptions } from '@tanstack/react-query';
import { listFlags } from './flags.api';
import { flagKeys } from './flags.constants';

/**
 * The deployment's flags. They change only when the API restarts, so they are asked for
 * once and kept: asking again on every screen would be noise. The cache is emptied when a
 * session ends anyway, which is often enough to notice a restart.
 */
export function flagsQuery() {
  return queryOptions({
    queryKey: flagKeys.all,
    queryFn: listFlags,
    staleTime: Infinity,
  });
}
