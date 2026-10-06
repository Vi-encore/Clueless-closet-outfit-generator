import type { ItemColor } from '../taxonomy/item-tags';
import type { Occasion, OutfitItem } from './types';

/** Sample colors with an unambiguous "bright" / "not bright" reading. Used by tests only. */
export const COLORS = {
  black: { family: 'black', hex: '#111111', share: 1 },
  white: { family: 'white', hex: '#f5f5f5', share: 1 },
  denim: { family: 'denim', hex: '#3b5b8c', share: 1 },
  red: { family: 'red', hex: '#dc2626', share: 1 },
  orange: { family: 'orange', hex: '#f97316', share: 1 },
  green: { family: 'green', hex: '#22c55e', share: 1 },
  navy: { family: 'navy', hex: '#1e2a4a', share: 1 },
  pastelPink: { family: 'pink', hex: '#f9d5e5', share: 1 },
} as const satisfies Record<string, ItemColor>;

export function top(id: string, tags: Partial<OutfitItem> = {}): OutfitItem {
  return { id, slot: 'top', type: 't_shirt', ...tags };
}

export function bottom(id: string, tags: Partial<OutfitItem> = {}): OutfitItem {
  return { id, slot: 'bottom', type: 'trousers', ...tags };
}

export const CASUAL: Occasion = { code: 'casual', targetFormality: 2 };
export const WORK: Occasion = { code: 'work', targetFormality: 3 };
