import type { Tuning } from './scoring.interfaces.js';

/**
 * Today's numbers, tuned by eye; revisit with real photos. Override any part by spreading:
 * `{ ...DEFAULT_TUNING, color: { ...DEFAULT_TUNING.color, accent: 1 } }`.
 */
export const DEFAULT_TUNING: Tuning = {
  maxFormalityGap: 2,
  color: {
    calm: 0.5,
    accent: 0.75,
    extraAccentPenalty: 0.5,
    bright: { minSaturation: 0.5, minLightness: 0.25, maxLightness: 0.85 },
  },
  formality: { pointsPerStep: 0.5 },
  // Our totals lie around -2..2, so the noise is far smaller than the 2.5 of outfit-algorithm.md.
  picking: { topK: 14, keep: 7, noise: 0.25 },
};
