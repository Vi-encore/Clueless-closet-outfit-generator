import { average, clamp } from './math.js';
import type { OutfitItem } from './schemas.js';
import type { Tuning } from './scoring.interfaces.js';
import { DEFAULT_TUNING } from './tuning.js';

/**
 * Formality component: 1 when the outfit's average formality equals the occasion's target,
 * lower the further it is (distance 2 → 0, distance 4 → −1). Returns 0 when any item has no formality.
 */
export function scoreFormality(
  items: readonly OutfitItem[],
  targetFormality: number,
  tuning: Tuning = DEFAULT_TUNING,
): number {
  const values: number[] = [];
  for (const item of items) {
    if (item.formality === undefined) return 0;
    values.push(item.formality);
  }
  if (values.length === 0) return 0;

  return clamp(1 - Math.abs(average(values) - targetFormality) * tuning.formality.pointsPerStep);
}
