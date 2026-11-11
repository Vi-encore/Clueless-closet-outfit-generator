import type { OccasionCode } from '../taxonomy/vocabularies.js';
import type { Occasion } from './schemas.js';

/**
 * The built-in occasions: a target formality and the weights that differ from 1.
 * Starting values, to be tuned; a table arrives with custom occasions.
 */
export const SYSTEM_OCCASIONS: Readonly<Record<OccasionCode, Occasion>> = {
  home: { code: 'home', targetFormality: 1 },
  sport: { code: 'sport', targetFormality: 1 },
  casual: { code: 'casual', targetFormality: 2 },
  travel: { code: 'travel', targetFormality: 2 },
  date: { code: 'date', targetFormality: 3 },
  work: { code: 'work', targetFormality: 3, weights: { formality: 1.5 } },
  party: { code: 'party', targetFormality: 4, weights: { color: 1.5 } },
};
