import type { Box } from './photo.interfaces';

/** Alpha at or below this is the haze a model leaves around an item, not the item. */
const HAZE = 8;

/**
 * The smallest box holding every opaque pixel of an RGBA image, or null when there is none.
 *
 * A cut-out comes back at the photograph's size with the item somewhere inside it. Cropped
 * to this box, the image *is* the item, so the doll can place it by its edges without ever
 * reading pixels from storage.
 */
export function opaqueBox(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = HAZE,
): Box | null {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if ((rgba[(y * width + x) * 4 + 3] ?? 0) > threshold) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }

  return right < 0 ? null : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}
