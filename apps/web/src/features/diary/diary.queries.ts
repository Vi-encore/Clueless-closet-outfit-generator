import { queryOptions } from '@tanstack/react-query';
import { listMemories, listMonth } from './diary.api';
import { diaryKeys } from './diary.constants';

/**
 * Shorter than the life of the photo links a month carries, so a month opened again much
 * later is asked for again rather than drawn with links that stopped working.
 */
const FRESH_FOR = 60_000;

/** One month of the diary. A day's screen reads the same entry. */
export function monthQuery(month: string) {
  return queryOptions({
    queryKey: diaryKeys.month(month),
    queryFn: () => listMonth(month),
    staleTime: FRESH_FOR,
  });
}

/** The desktop's memories, refreshed when a day's note or photo is saved. */
export function memoriesQuery() {
  return queryOptions({
    queryKey: diaryKeys.memories(),
    queryFn: listMemories,
    staleTime: FRESH_FOR,
  });
}
