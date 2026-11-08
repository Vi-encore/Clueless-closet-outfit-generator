import type { ItemColor } from '../taxonomy/item-tags.js';
import type { Occasion, OutfitItem } from './schemas.js';

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

export function onePiece(id: string, tags: Partial<OutfitItem> = {}): OutfitItem {
  return { id, slot: 'one_piece', type: 'dress', ...tags };
}

export function shoes(id: string, tags: Partial<OutfitItem> = {}): OutfitItem {
  return { id, slot: 'shoes', type: 'sneakers', ...tags };
}

export function outerwear(id: string, tags: Partial<OutfitItem> = {}): OutfitItem {
  return { id, slot: 'outerwear', type: 'coat', ...tags };
}

/** A seeded random source in [0, 1), so a test can repeat a "random" choice (mulberry32). */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
