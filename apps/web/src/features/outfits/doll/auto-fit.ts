import type { Slot } from '@closet/core';
import type { Anchors, Placement } from './doll.interfaces';
import { FIT } from './doll.constants';

/** Bottom to top: a bottom under a top, outerwear over both, shoes over everything. */
const LAYER = { bottom: 1, top: 2, one_piece: 2, outerwear: 3, shoes: 4 } as const;

function centred(top: number, width: number, layer: number): Placement {
  return { top: top * 100, width: width * 100, left: 50 - (width * 100) / 2, layer };
}

/**
 * Where an item of a slot goes on a doll: its top edge on the slot's line, centred, as wide
 * as the line times the slot's factor. Length is never adjusted - a crop top stays short.
 * Null for an accessory, which the doll does not wear yet.
 */
export function autoFit(slot: Slot, anchors: Anchors): Placement | null {
  switch (slot) {
    case 'top':
      return centred(anchors.shoulderY, anchors.shoulderWidth * FIT.top, LAYER.top);
    case 'bottom':
      return centred(anchors.waistY, anchors.hipWidth * FIT.bottom, LAYER.bottom);
    case 'one_piece':
      return centred(anchors.shoulderY, anchors.shoulderWidth * FIT.onePiece, LAYER.one_piece);
    case 'outerwear':
      return centred(anchors.shoulderY, anchors.shoulderWidth * FIT.outerwear, LAYER.outerwear);
    case 'shoes':
      return centred(anchors.ankleY, anchors.feetWidth * FIT.shoes, LAYER.shoes);
    case 'accessory':
      return null;
  }
}
