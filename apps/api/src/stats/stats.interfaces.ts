import type { ColorFamily, Slot } from '@closet/core';
import type { ItemView } from '../items/items.interfaces.js';

/** How many items of the wardrobe are in one slot. */
export interface SlotCount {
  slot: Slot;
  count: number;
}

/** How many items are mostly of one colour family; null for items with no colours. */
export interface ColorCount {
  family: ColorFamily | null;
  count: number;
}

/** The colours column of one item, as it comes from the database: JSON, or null. */
export interface ColorRow {
  colors: unknown;
}

/** What one wear of an item has cost so far, in its own currency. */
export interface CostPerWear {
  item: ItemView;
  /** Two decimals, as a string: the API does not promise floating point precision. */
  perWear: string;
  currency: string;
}

/** An item bought and not yet worn, with what it cost. */
export interface PricedItem {
  item: ItemView;
  price: string;
  currency: string;
}

/** The wardrobe in numbers, archived items left out. */
export interface StatsView {
  items: number;
  /** Items worn at least once: with `items`, the share of the wardrobe actually used. */
  worn: number;
  bySlot: SlotCount[];
  byColor: ColorCount[];
  /** Most worn first, five at most. */
  mostWorn: ItemView[];
  /** Cheapest per wear first. */
  costPerWear: CostPerWear[];
  /** Dearest first. */
  unwornWithPrice: PricedItem[];
}
