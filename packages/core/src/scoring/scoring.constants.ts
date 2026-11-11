import type { ColorFamily } from '../taxonomy/vocabularies.js';
import { DEFAULT_TUNING } from './tuning.js';

/** Colors that go with everything. */
export const NEUTRAL_COLOR_FAMILIES: readonly ColorFamily[] = [
  'black',
  'white',
  'grey',
  'beige',
  'denim',
];

/** Items in one outfit may differ in formality by at most this much, with the default tuning. */
export const MAX_FORMALITY_GAP = DEFAULT_TUNING.maxFormalityGap;
