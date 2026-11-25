import type { Box } from './photo.interfaces';

/**
 * Alpha at or below this, a quarter of opaque, is the haze a model leaves around an item,
 * not the item. A real cut-out had specks of 9 to 13 far above a crop top, and at 8 they
 * kept a third of the picture empty; the item's own edge is anti-aliased over a pixel or
 * two, so a quarter costs at most that.
 */
const HAZE = 64;

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

/** What share of the item a separate island must reach to be kept as part of it. */
const KEEP_SHARE = 0.25;

/**
 * Makes transparent every island of a cut-out much smaller than its largest, and answers
 * how many it dropped. An island is opaque pixels that touch, corners included: a strap
 * or a lace often meets an item only diagonally. The largest island is the item; one of
 * at least a quarter of it is kept too, so both shoes of a pair stay. Haze, at or below
 * the threshold, is the trim's to ignore and is left as it is.
 *
 * In place, on the RGBA the canvas gave: a cut-out is at most a million pixels, labelled
 * once with an explicit stack rather than recursion.
 */
export function dropStrays(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  threshold = HAZE,
  keep = KEEP_SHARE,
): number {
  const opaque = (index: number) => (rgba[index * 4 + 3] ?? 0) > threshold;
  const labels = new Int32Array(width * height);
  const sizes: number[] = [0];
  const stack: number[] = [];

  for (let start = 0; start < width * height; start++) {
    if (labels[start] !== 0 || !opaque(start)) {
      continue;
    }

    const label = sizes.length;
    let size = 0;
    labels[start] = label;
    stack.push(start);

    while (stack.length > 0) {
      const index = stack.pop() ?? 0;
      const x = index % width;
      const y = (index - x) / width;
      size += 1;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;

          if ((dx === 0 && dy === 0) || nx < 0 || ny < 0 || nx >= width || ny >= height) {
            continue;
          }

          const next = ny * width + nx;

          if (labels[next] === 0 && opaque(next)) {
            labels[next] = label;
            stack.push(next);
          }
        }
      }
    }

    sizes.push(size);
  }

  const largest = Math.max(0, ...sizes);
  const dropped = new Set(
    sizes.flatMap((size, label) => (label > 0 && size < largest * keep ? [label] : [])),
  );

  if (dropped.size > 0) {
    for (let index = 0; index < labels.length; index++) {
      if (dropped.has(labels[index] ?? 0)) {
        rgba[index * 4 + 3] = 0;
      }
    }
  }

  return dropped.size;
}
