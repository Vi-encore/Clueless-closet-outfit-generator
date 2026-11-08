import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { nextPage } from '../../shared/api/pages';
import { findOutfit, listSavedOutfits } from './outfits.api';
import type { Outfit } from './outfits.interfaces';

/**
 * Shorter than the life of the photo links an outfit carries, so one opened again from the
 * cache much later is asked for again rather than drawn with links that stopped working.
 */
const FRESH_FOR = 60_000;

export const outfitKeys = {
  all: ['outfits'] as const,
  saved: () => [...outfitKeys.all, 'saved'] as const,
  one: (id: string) => [...outfitKeys.all, id] as const,
};

/**
 * One outfit. A generated one is put here by the generation screen, so the screen and the
 * outfit's own address read and update the same entry.
 */
export function outfitQuery(id: string) {
  return queryOptions({
    queryKey: outfitKeys.one(id),
    queryFn: () => findOutfit(id),
    staleTime: FRESH_FOR,
  });
}

export function savedOutfitsQuery() {
  return infiniteQueryOptions({
    queryKey: outfitKeys.saved(),
    queryFn: ({ pageParam }) => listSavedOutfits(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextPage<Outfit>,
  });
}
