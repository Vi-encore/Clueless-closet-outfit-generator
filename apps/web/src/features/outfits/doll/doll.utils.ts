import { uk } from '../../../shared/i18n/uk';
import type { Item } from '../../wardrobe';
import type { Placement } from './doll.interfaces';

export const nameOf = (item: Item) => item.name ?? uk.types[item.type];

/** Position and width only: with no height the browser keeps the image's proportions. */
export function positioned({ left, top, width, layer }: Placement) {
  return { left: `${left}%`, top: `${top}%`, width: `${width}%`, zIndex: layer };
}
