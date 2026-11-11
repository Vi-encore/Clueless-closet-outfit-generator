import type { Occasion, OutfitItem } from '../scoring/schemas.js';
import type { OutfitScore, Tuning } from '../scoring/scoring.interfaces.js';

/** Any function returning a number in [0, 1), like `Math.random`. */
export type RandomSource = () => number;

export interface GenerateInput {
  /** The items to choose from: the API passes only those that can be worn. */
  readonly items: readonly OutfitItem[];
  readonly occasion: Occasion;
  /** Ids of items every outfit must hold, of any slot. */
  readonly mustInclude?: readonly string[];
  /** Ids of items no outfit may hold. */
  readonly exclude?: readonly string[];
  /** Item ids of outfits already shown; none of them comes back. */
  readonly seen?: readonly (readonly string[])[];
  /** How many distinct outfits to return at most; 1 by default. */
  readonly limit?: number;
  /** `Math.random` by default; tests pass a seeded one. */
  readonly random?: RandomSource;
  readonly tuning?: Tuning;
}

export interface GeneratedOutfit {
  /** In slot order: outerwear, top or one-piece, bottom, shoes. */
  itemIds: string[];
  /** The score of the whole outfit, layers included. */
  score: OutfitScore;
}

/** A combination that passed the hard filters, with its score. */
export interface ScoredCombination {
  readonly items: readonly OutfitItem[];
  readonly score: OutfitScore;
}

/** A candidate with noise added to its total, as the weighted choice sees it. */
export interface NoisyCandidate<T> {
  readonly candidate: T;
  readonly value: number;
}
