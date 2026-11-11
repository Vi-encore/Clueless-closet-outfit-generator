import type { Slot } from '../taxonomy/vocabularies.js';

/** The order an outfit's items come back in. Accessories are not part of an outfit yet. */
export const OUTFIT_SLOT_ORDER: readonly Slot[] = [
  'outerwear',
  'top',
  'one_piece',
  'bottom',
  'shoes',
];
