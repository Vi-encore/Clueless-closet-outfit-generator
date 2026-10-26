import type { OccasionCode } from '../taxonomy/vocabularies.js';
import type { Occasion, OutfitItem } from './schemas.js';

/** Items in one outfit may differ in formality by at most this much. */
export const MAX_FORMALITY_GAP = 2;

/** Why an outfit was rejected — structured, so the UI can phrase it in its own language. */
export type RejectionReason =
  | { kind: 'formality_gap'; gap: number }
  | { kind: 'avoided_occasion'; itemId: string; occasion: OccasionCode };

export type FilterResult = { ok: true } | { ok: false; reasons: RejectionReason[] };

/** Hard rules: an outfit that breaks one isn't scored at all. */
export function checkHardFilters(items: readonly OutfitItem[], occasion: Occasion): FilterResult {
  const reasons: RejectionReason[] = [];

  const formalities = items.flatMap((item) =>
    item.formality === undefined ? [] : [item.formality],
  );
  if (formalities.length > 1) {
    const gap = Math.max(...formalities) - Math.min(...formalities);
    if (gap > MAX_FORMALITY_GAP) {
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
