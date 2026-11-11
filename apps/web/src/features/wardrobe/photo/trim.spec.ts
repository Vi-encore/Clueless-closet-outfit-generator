import { describe, expect, it } from 'vitest';
import { opaqueBox } from './trim';

/** RGBA pixels of a `width` x `height` image, opaque only where `isOpaque` says. */
function pixels(width: number, height: number, isOpaque: (x: number, y: number) => boolean) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      rgba[(y * width + x) * 4 + 3] = isOpaque(x, y) ? 255 : 0;
    }
  }
  return rgba;
}

describe('Requirement: A cut-out is trimmed to the item', () => {
  it('Scenario: The margin is cropped', () => {
    const rgba = pixels(10, 8, (x, y) => x >= 2 && x <= 6 && y >= 1 && y <= 4);

    expect(opaqueBox(rgba, 10, 8)).toEqual({ x: 2, y: 1, width: 5, height: 4 });
  });

  it('Scenario: Nothing opaque', () => {
    expect(
      opaqueBox(
        pixels(10, 8, () => false),
        10,
        8,
      ),
    ).toBeNull();
  });

  it('ignores the faint haze a model leaves around an item', () => {
    const rgba = pixels(10, 8, (x, y) => x === 5 && y === 5);
    rgba[3] = 4;

    expect(opaqueBox(rgba, 10, 8)).toEqual({ x: 5, y: 5, width: 1, height: 1 });
  });
});
