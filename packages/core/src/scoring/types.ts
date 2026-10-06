import type { ItemTags } from '../taxonomy/item-tags';
import type { OccasionCode } from '../taxonomy/vocabularies';

/** The scoring components implemented so far; more arrive with the generator (step 10). */
export const COMPONENTS = ['color', 'formality'] as const;
export type ComponentName = (typeof COMPONENTS)[number];

/** Per-component scores, each from −1 (clash) to 1 (ideal); 0 means no effect or no data. */
export type ScoreBreakdown = Record<ComponentName, number>;

export interface Occasion {
  code: OccasionCode;
  /** 1 (home) … 5 (black tie). */
  targetFormality: number;
  /** Component weights; a missing weight counts as 1. */
  weights?: Partial<Record<ComponentName, number>>;
}

/** An item taking part in an outfit: its tags plus an id that explanations can point at. */
export type OutfitItem = ItemTags & { id: string };

export interface OutfitScore {
  total: number;
  breakdown: ScoreBreakdown;
}
