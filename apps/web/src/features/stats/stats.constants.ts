import type { Slot } from '@closet/core';

export const statsKeys = {
  all: ['stats'] as const,
  summary: () => [...statsKeys.all, 'summary'] as const,
  unworn: (days: string) => [...statsKeys.all, 'unworn', days] as const,
};

/** How long unworn can be asked about; the API refuses anything else. */
export const UNWORN_DAYS = ['30', '90', '180'] as const;

export const DEFAULT_UNWORN_DAYS = '90';

/**
 * A colour per category for its pie chart: the app's own purples and pinks, with navy and
 * teal for contrast, so that no two slices beside each other look alike.
 */
export const SLOT_COLOURS: Record<Slot, string> = {
  top: '#7b2d8e',
  bottom: '#000080',
  one_piece: '#ec5fa4',
  outerwear: '#008080',
  shoes: '#808080',
  accessory: '#f7d731',
};

/** The sector of items whose colours are not known. */
export const NO_COLOUR = '#c0c0c0';
