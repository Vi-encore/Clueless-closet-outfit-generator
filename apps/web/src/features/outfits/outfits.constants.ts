import { type OccasionCode } from '@closet/core';

/** A score as it is read on screen: one decimal, with a comma. */
export const SCORE_FORMAT = new Intl.NumberFormat('uk-UA', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const DEFAULT_OCCASION: OccasionCode = 'casual';

export const outfitKeys = {
  all: ['outfits'] as const,
  saved: () => [...outfitKeys.all, 'saved'] as const,
  one: (id: string) => [...outfitKeys.all, id] as const,
};
