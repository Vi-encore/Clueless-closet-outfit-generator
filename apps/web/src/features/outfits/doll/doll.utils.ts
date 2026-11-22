import { uk } from '../../../shared/i18n/uk';
import type { Item } from '../../wardrobe';
import { autoFit } from './auto-fit';
import { BACKDROPS, type Backdrop } from './doll.constants';
import type { Fitted, Placement } from './doll.interfaces';
import { MANNEQUIN } from './mannequin';

export const nameOf = (item: Item) => item.name ?? uk.types[item.type];

/**
 * The items that go on the doll, each with its cut-out and its place. An item without a
 * cut-out would be its whole photograph, background and all, so it is left off.
 */
export function fittedOf(items: readonly Item[]): Fitted[] {
  return items.flatMap((item) => {
    const placement = autoFit(item.slot, MANNEQUIN.anchors);
    return item.cutoutUrl !== null && placement !== null
      ? [{ item, src: item.cutoutUrl, placement }]
      : [];
  });
}

/** Position and width only: with no height the browser keeps the image's proportions. */
export function positioned({ left, top, width, layer }: Placement) {
  return { left: `${left}%`, top: `${top}%`, width: `${width}%`, zIndex: layer };
}

/** Relative luminance of `#rrggbb`, as WCAG defines it: 0 for black, 1 for white. */
function luminance(hex: string): number {
  const channel = (start: number) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG's contrast ratio of two colours, from 1 (the same) to 21 (black on white). */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];

  return (light + 0.05) / (dark + 0.05);
}

/**
 * The backdrop the outfit shows against best: of the three, the one whose weakest contrast
 * with any item's main colour is the strongest. A white top alone asks for the dark one,
 * black alone for the light one, and the two together meet in the middle. An outfit with
 * no colours known stands on the light one, the first in the list.
 */
export function backdropFor(items: readonly Item[]): Backdrop {
  const mains = items.flatMap((item) => {
    const main = [...(item.colors ?? [])].sort((a, b) => b.share - a.share)[0];
    return main === undefined ? [] : [main.hex];
  });
  const names = Object.keys(BACKDROPS) as Backdrop[];

  if (mains.length === 0) {
    return 'light';
  }

  const weakest = (name: Backdrop) =>
    Math.min(...mains.map((hex) => contrast(hex, BACKDROPS[name])));

  return names.reduce((best, name) => (weakest(name) > weakest(best) ? name : best));
}
