import { checkHardFilters } from '../scoring/filters.js';
import type { OutfitItem } from '../scoring/schemas.js';
import { scoreOutfit } from '../scoring/score-outfit.js';
import { DEFAULT_TUNING } from '../scoring/tuning.js';
import type { Slot } from '../taxonomy/vocabularies.js';
import { makeBases } from './bases.js';
import type { GenerateInput, GeneratedOutfit, ScoredCombination } from './generator.interfaces.js';
import { addLayers } from './layers.js';
import { pickOne } from './pick.js';
import { OUTFIT_SLOT_ORDER } from './generator.constants.js';

const BASE_SLOTS: readonly Slot[] = ['top', 'bottom', 'one_piece'];
const LAYER_SLOTS: readonly Slot[] = ['shoes', 'outerwear'];

/** The same items in any order give the same key. */
function keyOf(itemIds: readonly string[]): string {
  return [...itemIds].sort().join('\n');
}

function inSlotOrder(items: readonly OutfitItem[]): string[] {
  return [...items]
    .sort((a, b) => OUTFIT_SLOT_ORDER.indexOf(a.slot) - OUTFIT_SLOT_ORDER.indexOf(b.slot))
    .map((item) => item.id);
}

/** True when the chosen items could share one outfit: one shoes, one outerwear, no accessory. */
function canShareOutfit(required: readonly OutfitItem[]): boolean {
  const countOf = (slot: Slot): number => required.filter((item) => item.slot === slot).length;
  return countOf('accessory') === 0 && LAYER_SLOTS.every((slot) => countOf(slot) <= 1);
}

/**
 * Makes up to `limit` distinct outfits for the occasion from the items given.
 * Pure: the randomness comes from `random`. When no outfit can be made — no base, chosen items that
 * cannot share an outfit, everything already seen — the result is empty.
 */
export function generateOutfits(input: GenerateInput): GeneratedOutfit[] {
  const {
    items,
    occasion,
    mustInclude = [],
    exclude = [],
    seen = [],
    limit = 1,
    random = Math.random,
    tuning = DEFAULT_TUNING,
  } = input;

  const pool = items.filter((item) => !exclude.includes(item.id));
  const required = pool.filter((item) => mustInclude.includes(item.id));
  if (required.length < new Set(mustInclude).size || !canShareOutfit(required)) return [];

  const requiredInBase = required.filter((item) => BASE_SLOTS.includes(item.slot));
  const remaining: ScoredCombination[] = makeBases(pool)
    .filter((base) => requiredInBase.every((item) => base.includes(item)))
    .filter((base) => checkHardFilters(base, occasion, tuning).ok)
    .map((base) => ({ items: base, score: scoreOutfit(base, occasion, tuning) }));

  const taken = new Set(seen.map(keyOf));
  const outfits: GeneratedOutfit[] = [];
  while (outfits.length < limit) {
    const picked = pickOne(remaining, random, tuning.picking);
    if (picked === undefined) break;
    remaining.splice(remaining.indexOf(picked), 1);

    const outfit = addLayers(picked, pool, required, occasion, tuning);
    if (outfit === undefined) continue;
    const itemIds = inSlotOrder(outfit.items);
    const key = keyOf(itemIds);
    if (taken.has(key)) continue;

    taken.add(key);
    outfits.push({ itemIds, score: outfit.score });
  }
  return outfits;
}
