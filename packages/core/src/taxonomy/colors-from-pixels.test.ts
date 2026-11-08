import { describe, expect, it } from 'vitest';
import { colorsFromPixels } from './colors-from-pixels.js';
import type { PixelRun } from '../test.interfaces.js';

/** RGBA bytes made of runs of one pixel repeated, the way `getImageData` lays them out. */
function pixels(...runs: PixelRun[]): Uint8ClampedArray {
  const bytes = runs.flatMap(({ rgba, count }) => Array.from({ length: count }, () => rgba).flat());

  return new Uint8ClampedArray(bytes);
}

const RED: PixelRun['rgba'] = [200, 30, 35, 255];
const NAVY: PixelRun['rgba'] = [25, 35, 75, 255];
const WHITE: PixelRun['rgba'] = [245, 245, 242, 255];
const BLACK: PixelRun['rgba'] = [18, 18, 20, 255];
const BEIGE: PixelRun['rgba'] = [215, 195, 160, 255];
const GREEN: PixelRun['rgba'] = [40, 140, 60, 255];
const CLEAR: PixelRun['rgba'] = [0, 0, 0, 0];

describe("Requirement: Colors are read from an item's pixels", () => {
  it('Scenario: One color', () => {
    const colors = colorsFromPixels(pixels({ rgba: RED, count: 100 }));

    expect(colors).toHaveLength(1);
    expect(colors[0]?.family).toBe('red');
    expect(colors[0]?.share).toBe(1);
    expect(colors[0]?.hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('Scenario: Transparent pixels do not count', () => {
    const colors = colorsFromPixels(pixels({ rgba: NAVY, count: 50 }, { rgba: CLEAR, count: 50 }));

    expect(colors.map(({ family, share }) => ({ family, share }))).toEqual([
      { family: 'navy', share: 1 },
    ]);
  });

  it('Scenario: Shares and order', () => {
    const colors = colorsFromPixels(pixels({ rgba: BLACK, count: 25 }, { rgba: WHITE, count: 75 }));

    expect(colors.map(({ family, share }) => ({ family, share }))).toEqual([
      { family: 'white', share: 0.75 },
      { family: 'black', share: 0.25 },
    ]);
  });

  it('Scenario: Specks are left out', () => {
    const colors = colorsFromPixels(pixels({ rgba: BEIGE, count: 95 }, { rgba: GREEN, count: 5 }));

    expect(colors.map(({ family }) => family)).toEqual(['beige']);
  });

  it('Scenario: A fully transparent image has no colors', () => {
    expect(colorsFromPixels(pixels({ rgba: CLEAR, count: 10 }))).toEqual([]);
  });

  it('returns at most three colors', () => {
    const colors = colorsFromPixels(
      pixels(
        { rgba: RED, count: 25 },
        { rgba: NAVY, count: 25 },
        { rgba: WHITE, count: 25 },
        { rgba: GREEN, count: 25 },
      ),
    );

    expect(colors).toHaveLength(3);
  });
});
