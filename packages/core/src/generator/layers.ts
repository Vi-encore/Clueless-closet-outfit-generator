import { checkHardFilters } from '../scoring/filters.js';
import { scoreOutfit } from '../scoring/score-outfit.js';
import type { Occasion, OutfitItem } from '../scoring/schemas.js';
import type { Tuning } from '../scoring/scoring.interfaces.js';
import type { ScoredCombination } from './generator.interfaces.js';

/**
 * The best-scoring combination of `base` with one of `candidates` that passes the hard filters,
 * or undefined when none passes. Ties go to the earlier candidate.
 */
function bestWith(
  base: readonly OutfitItem[],
  candidates: readonly OutfitItem[],
  occasion: Occasion,
  tuning: Tuning,
): ScoredCombination | undefined {
  let best: ScoredCombination | undefined;
  for (const candidate of candidates) {
    const items = [...base, candidate];
    if (!checkHardFilters(items, occasion, tuning).ok) continue;
    const score = scoreOutfit(items, occasion, tuning);
    if (best === undefined || score.total > best.score.total) best = { items, score };
  }
  return best;
}

/**
 * Adds layers to a base greedily: the best shoes when any pass the filters, then the best outerwear
 * when it does not lower the score. A layer in `required` is the only candidate of its slot and is
 * always added; when it cannot be, the base cannot hold it and the result is undefined.
 */
export function addLayers(
  base: ScoredCombination,
  pool: readonly OutfitItem[],
  required: readonly OutfitItem[],
  occasion: Occasion,
  tuning: Tuning,
): ScoredCombination | undefined {
  let outfit = base;

  for (const slot of ['shoes', 'outerwear'] as const) {
    const requiredOfSlot = required.filter((item) => item.slot === slot);
    const candidates =
      requiredOfSlot.length > 0 ? requiredOfSlot : pool.filter((item) => item.slot === slot);
    const layered = bestWith(outfit.items, candidates, occasion, tuning);

    if (requiredOfSlot.length > 0) {
      if (layered === undefined) return undefined;
      outfit = layered;
    } else if (
      layered !== undefined &&
      (slot === 'shoes' || layered.score.total >= outfit.score.total)
    ) {
      outfit = layered;
    }
  }

  return outfit;
}
