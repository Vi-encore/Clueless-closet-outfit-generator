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
