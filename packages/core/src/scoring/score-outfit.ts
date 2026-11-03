import { scoreColor } from './color.js';
import { scoreFormality } from './formality.js';
import type { Occasion, OutfitItem } from './schemas.js';
import { COMPONENTS } from './components.js';
import type { OutfitScore, ScoreBreakdown } from './scoring.interfaces.js';

/** Sum of component scores multiplied by their weights; a missing weight counts as 1. */
export function weightedTotal(
  breakdown: ScoreBreakdown,
  weights: Occasion['weights'] = {},
): number {
  return COMPONENTS.reduce(
    (sum, component) => sum + breakdown[component] * (weights[component] ?? 1),
    0,
  );
}

/** Scores an outfit that already passed `checkHardFilters`. */
export function scoreOutfit(items: readonly OutfitItem[], occasion: Occasion): OutfitScore {
  const breakdown: ScoreBreakdown = {
    color: scoreColor(items),
    formality: scoreFormality(items, occasion.targetFormality),
  };
  return { total: weightedTotal(breakdown, occasion.weights), breakdown };
}
