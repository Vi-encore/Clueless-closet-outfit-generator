import type { OutfitItem } from '../scoring/schemas.js';

/** Every base an outfit can stand on: each top with each bottom, and each one-piece alone. */
export function makeBases(items: readonly OutfitItem[]): OutfitItem[][] {
  const tops = items.filter((item) => item.slot === 'top');
  const bottoms = items.filter((item) => item.slot === 'bottom');
  const onePieces = items.filter((item) => item.slot === 'one_piece');

  return [
    ...tops.flatMap((top) => bottoms.map((bottom) => [top, bottom])),
    ...onePieces.map((onePiece) => [onePiece]),
  ];
}
