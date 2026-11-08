import type { Item } from '../../wardrobe';

/**
 * Where a doll's body lines are, as fractions of its frame (0-1), so a doll looks the same
 * at any size. Widths are centred on the frame.
 */
export interface Anchors {
  shoulderY: number;
  shoulderWidth: number;
  waistY: number;
  hipWidth: number;
  ankleY: number;
  feetWidth: number;
}

/** A doll base: a picture and its anchors. The render code knows nothing else of it. */
export interface Mannequin {
  /** The frame the drawing is made in; its ratio is the doll's. */
  width: number;
  height: number;
  /** SVG path data of the silhouette, in that frame. */
  body: string;
  head: HeadCircle;
  anchors: Anchors;
}

export interface HeadCircle {
  cx: number;
  cy: number;
  r: number;
}

/** Where an item's image goes, in percent of the frame. No height: the image keeps its own. */
export interface Placement {
  left: number;
  top: number;
  width: number;
  /** Higher is drawn over lower. */
  layer: number;
}

export interface DollProps {
  /** The outfit's items, in any order. */
  items: readonly Item[];
}
