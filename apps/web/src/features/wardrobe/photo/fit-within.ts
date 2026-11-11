import type { Size } from './photo.interfaces';

/**
 * The size an image becomes when its longer side may be at most `longest`. Never larger
 * than it was: enlarging adds bytes and no detail.
 */
export function fitWithin(width: number, height: number, longest: number): Size {
  const scale = Math.min(1, longest / Math.max(width, height));

  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
