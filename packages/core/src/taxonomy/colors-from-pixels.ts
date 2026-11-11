import type { ItemColor } from './item-tags.js';
import type { ColorTally, Lab, Rgb } from './taxonomy.interfaces.js';
import type { ColorFamily } from './vocabularies.js';

/** Below half opacity a pixel is background the cut-out left soft, not the item. */
const OPAQUE = 128;

/** A color under a tenth of the item is a button, a seam or a shadow, not its color. */
const LEAST_SHARE = 0.1;

const MOST_COLORS = 3;

/**
 * What each family looks like, once or twice where one point would cover it badly.
 * Nearest wins, measured in CIELAB, so these only have to be typical, not exhaustive.
 */
const REFERENCES: ReadonlyArray<readonly [ColorFamily, Rgb]> = [
  ['black', [20, 20, 22]],
  ['white', [245, 245, 242]],
  ['grey', [80, 80, 82]],
  ['grey', [128, 128, 128]],
  ['grey', [190, 190, 190]],
  ['beige', [220, 200, 165]],
  ['beige', [195, 175, 140]],
  ['brown', [105, 65, 40]],
  ['brown', [150, 100, 60]],
  ['denim', [70, 100, 140]],
  ['denim', [95, 125, 165]],
  ['navy', [25, 35, 75]],
  ['navy', [40, 50, 95]],
  ['blue', [40, 90, 200]],
  ['blue', [110, 160, 225]],
  ['green', [40, 140, 60]],
  ['green', [100, 125, 70]],
  ['green', [150, 200, 125]],
  ['yellow', [235, 200, 40]],
  ['yellow', [240, 225, 130]],
  ['orange', [235, 120, 30]],
  ['red', [200, 30, 35]],
  ['red', [130, 20, 30]],
  ['pink', [240, 155, 185]],
  ['pink', [215, 80, 135]],
  ['purple', [115, 50, 145]],
  ['purple', [170, 125, 200]],
];

/** sRGB to CIELAB under a D65 white, the usual way. */
function toLab([red, green, blue]: Rgb): Lab {
  const linear = (channel: number) => {
    const c = channel / 255;

    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = [linear(red), linear(green), linear(blue)];

  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const REFERENCE_LABS = REFERENCES.map(([family, rgb]) => [family, toLab(rgb)] as const);

function familyOf(rgb: Rgb): ColorFamily {
  const lab = toLab(rgb);
  let nearest: ColorFamily = 'grey';
  let shortest = Infinity;

  for (const [family, reference] of REFERENCE_LABS) {
    const distance = Math.hypot(
      lab[0] - reference[0],
      lab[1] - reference[1],
      lab[2] - reference[2],
    );

    if (distance < shortest) {
      shortest = distance;
      nearest = family;
    }
  }

  return nearest;
}

function hexOf({ red, green, blue, count }: ColorTally): string {
  const channel = (sum: number) =>
    Math.round(sum / count)
      .toString(16)
      .padStart(2, '0');

  return `#${channel(red)}${channel(green)}${channel(blue)}`;
}

/**
 * An item's colors from the RGBA bytes of its image, as `getImageData` gives them.
 *
 * Pixels are first gathered into coarse buckets, so that a photo's thousands of nearly
 * equal shades are named once per bucket rather than once per pixel. Each bucket is
 * named by its nearest family, buckets of one family are added together, and the hex
 * is the average of everything that family took in. The share is of the opaque area,
 * since the transparent rest is not the item.
 */
export function colorsFromPixels(rgba: Uint8ClampedArray): ItemColor[] {
  const buckets = new Map<number, ColorTally>();
  let opaque = 0;

  for (let at = 0; at + 3 < rgba.length; at += 4) {
    const [red, green, blue, alpha] = [
      rgba[at] ?? 0,
      rgba[at + 1] ?? 0,
      rgba[at + 2] ?? 0,
      rgba[at + 3] ?? 0,
    ];

    if (alpha < OPAQUE) {
      continue;
    }

    opaque += 1;

    // Sixteen levels a channel: fine enough to keep navy from black, coarse enough to be few.
    const key = ((red >> 4) << 8) | ((green >> 4) << 4) | (blue >> 4);
    const tally = buckets.get(key) ?? { red: 0, green: 0, blue: 0, count: 0 };

    buckets.set(key, {
      red: tally.red + red,
      green: tally.green + green,
      blue: tally.blue + blue,
      count: tally.count + 1,
    });
  }

  const families = new Map<ColorFamily, ColorTally>();

  for (const tally of buckets.values()) {
    const family = familyOf([
      tally.red / tally.count,
      tally.green / tally.count,
      tally.blue / tally.count,
    ]);
    const sum = families.get(family) ?? { red: 0, green: 0, blue: 0, count: 0 };

    families.set(family, {
      red: sum.red + tally.red,
      green: sum.green + tally.green,
      blue: sum.blue + tally.blue,
      count: sum.count + tally.count,
    });
  }

  return [...families]
    .map(([family, tally]) => ({
      family,
      hex: hexOf(tally),
      share: Math.round((tally.count / opaque) * 100) / 100,
    }))
    .filter(({ share }) => share >= LEAST_SHARE)
    .sort((a, b) => b.share - a.share)
    .slice(0, MOST_COLORS);
}
