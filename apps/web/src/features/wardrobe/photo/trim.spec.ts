import { describe, expect, it } from 'vitest';
import { dropStrays, opaqueBox } from './trim';

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

  it('Scenario: Haze far from the item is cropped', () => {
    const rgba = pixels(10, 8, (x, y) => x >= 4 && x <= 6 && y >= 3 && y <= 5);
    // What a model left on a real cut-out, far from the item: specks of alpha 9 to 13,
    // and a soft shadow a little stronger. None of it is the item.
    rgba[3] = 13;
    rgba[(7 * 10 + 9) * 4 + 3] = 40;
    rgba[9 * 4 + 3] = 64;

    expect(opaqueBox(rgba, 10, 8)).toEqual({ x: 4, y: 3, width: 3, height: 3 });
  });

  it('ignores the faint haze a model leaves around an item', () => {
    const rgba = pixels(10, 8, (x, y) => x === 5 && y === 5);
    rgba[3] = 4;

    expect(opaqueBox(rgba, 10, 8)).toEqual({ x: 5, y: 5, width: 1, height: 1 });
  });
});

/** Alpha of one pixel. */
const alphaAt = (rgba: Uint8ClampedArray, width: number, x: number, y: number) =>
  rgba[(y * width + x) * 4 + 3];

describe('Requirement: A cut-out keeps the item and drops what stands apart', () => {
  it('Scenario: A scrap beside the item is dropped', () => {
    // A 10x10 item in a 20x12 image, and a 3x3 scrap at its right edge: under a tenth.
    const rgba = pixels(
      20,
      12,
      (x, y) =>
        (x >= 1 && x <= 10 && y >= 1 && y <= 10) || (x >= 16 && x <= 18 && y >= 2 && y <= 4),
    );

    expect(dropStrays(rgba, 20, 12)).toBe(1);

    expect(alphaAt(rgba, 20, 17, 3)).toBe(0);
    expect(alphaAt(rgba, 20, 5, 5)).toBe(255);
    expect(opaqueBox(rgba, 20, 12)).toEqual({ x: 1, y: 1, width: 10, height: 10 });
  });

  it('Scenario: A pair is kept', () => {
    // Two shoes, 4x3 and 4x4, apart from each other.
    const rgba = pixels(
      12,
      6,
      (x, y) => (x >= 0 && x <= 3 && y >= 1 && y <= 3) || (x >= 7 && x <= 10 && y >= 1 && y <= 4),
    );

    expect(dropStrays(rgba, 12, 6)).toBe(0);

    expect(alphaAt(rgba, 12, 1, 2)).toBe(255);
    expect(alphaAt(rgba, 12, 8, 2)).toBe(255);
  });

  it('Scenario: A diagonal touch is one island', () => {
    // A 4x4 body, and a strap leaving its corner diagonally: (4,4), (5,5), (6,6).
    const rgba = pixels(8, 8, (x, y) => (x <= 3 && y <= 3) || (x === y && x >= 4 && x <= 6));

    expect(dropStrays(rgba, 8, 8)).toBe(0);

    expect(alphaAt(rgba, 8, 6, 6)).toBe(255);
  });

  it('Scenario: Nothing opaque', () => {
    const rgba = pixels(6, 6, () => false);

    expect(dropStrays(rgba, 6, 6)).toBe(0);
    expect(rgba.every((value) => value === 0)).toBe(true);
  });

  it('leaves haze to the trim, and keeps what is at least a quarter of the item', () => {
    // An 8x8 item (64), a 4x4 part (16, exactly a quarter) apart from it, and haze.
    const rgba = pixels(
      16,
      10,
      (x, y) => (x <= 7 && y <= 7) || (x >= 11 && x <= 14 && y >= 2 && y <= 5),
    );
    rgba[(9 * 16 + 15) * 4 + 3] = 20;

    expect(dropStrays(rgba, 16, 10)).toBe(0);

    expect(alphaAt(rgba, 16, 12, 3)).toBe(255);
    expect(alphaAt(rgba, 16, 15, 9)).toBe(20);
  });
});
