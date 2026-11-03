import type { FilterResult, OutfitScore } from '@closet/core';

/** The filter verdict, plus a score only when the outfit got far enough to deserve one. */
export interface ScoreOutfitResponse {
  filters: FilterResult;
  score?: OutfitScore;
}
