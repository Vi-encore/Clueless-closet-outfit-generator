import type { Occasion, OutfitItem } from './schemas.js';
import type { RejectionReason, FilterResult, Tuning } from './scoring.interfaces.js';
import { DEFAULT_TUNING } from './tuning.js';

/** Items in one outfit may differ in formality by at most this much, with the default tuning. */
export const MAX_FORMALITY_GAP = DEFAULT_TUNING.maxFormalityGap;

/** Hard rules: an outfit that breaks one isn't scored at all. */
export function checkHardFilters(
  items: readonly OutfitItem[],
  occasion: Occasion,
  tuning: Tuning = DEFAULT_TUNING,
): FilterResult {
  const reasons: RejectionReason[] = [];

  const formalities = items.flatMap((item) =>
    item.formality === undefined ? [] : [item.formality],
  );
  if (formalities.length > 1) {
    const gap = Math.max(...formalities) - Math.min(...formalities);
    if (gap > tuning.maxFormalityGap) {
      reasons.push({ kind: 'formality_gap', gap });
    }
  }

  for (const item of items) {
    if (item.avoidOccasions?.includes(occasion.code)) {
      reasons.push({ kind: 'avoided_occasion', itemId: item.id, occasion: occasion.code });
    }
  }

  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}
