import { uk } from '../../../shared/i18n/uk';
import type { Item } from '../../wardrobe';
import { autoFit } from './auto-fit';
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
