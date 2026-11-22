/**
 * How much wider than the body line each kind of item is drawn: sleeves stick out past the
 * shoulders, trousers lie flat wider than hips. Tuned by eye on real cut-outs.
 */
export const FIT = {
  top: 1.5,
  bottom: 1.3,
  onePiece: 1.5,
  outerwear: 1.75,
  shoes: 1,
} as const;

/**
 * What the doll can stand on, lightest first: the title bar's lilac, washed out, darkened
 * halfway, and nearly to night. Each outfit gets the one it shows against best.
 */
export const BACKDROPS = {
  light: '#f4eefa',
  middle: '#8a7ca0',
  dark: '#3b2a4d',
} as const;

export type Backdrop = keyof typeof BACKDROPS;
