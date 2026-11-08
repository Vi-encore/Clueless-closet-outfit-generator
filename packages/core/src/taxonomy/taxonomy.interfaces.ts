import type { TagSuggestion } from './tag-suggestion.js';

/** Red, green and blue, each 0–255. */
export type Rgb = readonly [number, number, number];

/** A color in CIELAB, where distance is close to how different two colors look. */
export type Lab = readonly [number, number, number];

/** Opaque pixels gathered under one name, before they become an `ItemColor`. */
export interface ColorTally {
  /** Sums of each channel, so the average can be taken once at the end. */
  red: number;
  green: number;
  blue: number;
  count: number;
}

/** A tag a suggestion can carry: every field but the list of uncertain ones. */
export type SuggestedTag = Exclude<keyof TagSuggestion, 'uncertain'>;
