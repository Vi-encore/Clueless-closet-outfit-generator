import type { ItemColor } from '../taxonomy/item-tags.js';
import type { ColorFamily } from '../taxonomy/vocabularies.js';
import { clamp } from './math.js';
import type { OutfitItem } from './schemas.js';
import type { BrightnessTuning, Hsl, Tuning } from './scoring.interfaces.js';
import { DEFAULT_TUNING } from './tuning.js';

/** Colors that go with everything. */
export const NEUTRAL_COLOR_FAMILIES: readonly ColorFamily[] = [
  'black',
  'white',
  'grey',
  'beige',
  'denim',
];

/** Converts '#rrggbb' to HSL, where "how saturated" and "how light" are easy to read. */
export function hexToHsl(hex: string): Hsl {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) {
    return { h: 0, s: 0, l }; // a shade of grey
  }

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h *= 60;
  if (h < 0) h += 360;

  return { h, s, l };
}

/** The color covering the largest share of the item. */
export function mainColor(colors: readonly ItemColor[]): ItemColor | undefined {
  let main: ItemColor | undefined;
  for (const color of colors) {
    if (main === undefined || color.share > main.share) main = color;
  }
  return main;
}

export function isNeutral(color: ItemColor): boolean {
  return NEUTRAL_COLOR_FAMILIES.includes(color.family);
}

export function isBright(
  color: ItemColor,
  bright: BrightnessTuning = DEFAULT_TUNING.color.bright,
): boolean {
  if (isNeutral(color)) return false;
  const { s, l } = hexToHsl(color.hex);
  return s >= bright.minSaturation && l >= bright.minLightness && l <= bright.maxLightness;
}

/**
 * Color component: neutrals go with everything, at most one bright accent and at most one print.
 * Returns 0 when any item has no colors yet.
 */
export function scoreColor(items: readonly OutfitItem[], tuning: Tuning = DEFAULT_TUNING): number {
  const { calm, accent, extraAccentPenalty, bright } = tuning.color;
  const mains: ItemColor[] = [];
  for (const item of items) {
    const main = item.colors ? mainColor(item.colors) : undefined;
    if (main === undefined) return 0;
    mains.push(main);
  }
  if (mains.length === 0) return 0;

  const brightCount = mains.filter((color) => isBright(color, bright)).length;
  const printCount = items.filter(
    (item) => item.pattern !== undefined && item.pattern !== 'solid',
  ).length;

  const extras = Math.max(0, brightCount - 1) + Math.max(0, printCount - 1);
  if (extras > 0) {
    return clamp(-extraAccentPenalty * extras);
  }
  return brightCount === 1 ? accent : calm;
}
