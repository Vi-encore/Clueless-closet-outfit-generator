import { average, clamp } from './math';
import type { OutfitItem } from './types';

/** Each step between the outfit's average formality and the target costs half a point. */
const POINTS_PER_STEP = 0.5;

/**
 * Formality component: 1 when the outfit's average formality equals the occasion's target,
 * lower the further it is (distance 2 → 0, distance 4 → −1). Returns 0 when any item has no formality.
 */
export function scoreFormality(items: readonly OutfitItem[], targetFormality: number): number {
  const values: number[] = [];
  for (const item of items) {
    if (item.formality === undefined) return 0;
    values.push(item.formality);
  }
  if (values.length === 0) return 0;

  return clamp(1 - Math.abs(average(values) - targetFormality) * POINTS_PER_STEP);
}
