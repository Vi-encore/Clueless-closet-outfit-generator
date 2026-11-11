import type { Mannequin } from './doll.interfaces';

/**
 * The standard mannequin: one drawn silhouette, neutral grey, and the lines items hang
 * from. Other bases (from measurements or a photograph, step 14) replace this object.
 */
export const MANNEQUIN: Mannequin = {
  width: 100,
  height: 220,
  head: { cx: 50, cy: 22, r: 12 },
  body:
    'M45 33 L55 33 L56 41 Q66 42 69 46 L76 92 L71 93 L66 56 L65 92 L69 122 L64 194 ' +
    'L62 210 L55 210 L54 194 L51 128 L49 128 L46 194 L45 210 L38 210 L36 194 L31 122 ' +
    'L35 92 L34 56 L29 93 L24 92 L31 46 Q34 42 44 41 Z',
  anchors: {
    shoulderY: 0.2,
    shoulderWidth: 0.36,
    waistY: 0.42,
    hipWidth: 0.34,
    ankleY: 0.88,
    feetWidth: 0.3,
  },
};
