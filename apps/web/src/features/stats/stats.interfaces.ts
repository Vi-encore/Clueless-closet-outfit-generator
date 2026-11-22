import type { ColorFamily, Slot } from '@closet/core';
import type { Item } from '../wardrobe';

export interface SlotCount {
  slot: Slot;
  count: number;
}

/** Null for the items with no colours. */
export interface ColorCount {
  family: ColorFamily | null;
  count: number;
}

/** What one wear of an item has cost so far: two decimals, in its own currency. */
export interface CostPerWearLine {
  item: Item;
  perWear: string;
  currency: string;
}

export interface PricedLine {
  item: Item;
  price: string;
  currency: string;
}

/** The wardrobe in numbers, as `GET /stats` answers it. */
export interface StatsSummary {
  items: number;
  worn: number;
  bySlot: SlotCount[];
  byColor: ColorCount[];
  mostWorn: Item[];
  costPerWear: CostPerWearLine[];
  unwornWithPrice: PricedLine[];
}

/** Where a sector of a pie chart starts and ends, in turns: 0 is the top, 1 all the way round. */
export interface Sector {
  from: number;
  to: number;
}

/** One sector of a pie chart and its line in the legend. */
export interface PieSlice {
  key: string;
  label: string;
  count: number;
  colour: string;
}

export interface PieChartProps {
  /** What the chart is of; the figure's accessible name. */
  label: string;
  slices: readonly PieSlice[];
}

export interface WornBarsProps {
  /** Most worn first, as the API answers them. */
  items: readonly Item[];
}

export interface CostPerWearProps {
  costPerWear: readonly CostPerWearLine[];
  unwornWithPrice: readonly PricedLine[];
}

export interface ItemThumbProps {
  item: Item;
}
