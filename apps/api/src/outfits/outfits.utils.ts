import { OUTFIT_SLOT_ORDER, outfitItemSchema, type OutfitItem, type Slot } from '@closet/core';
import type { Item, WearLog } from '../generated/prisma/client.js';
import { tagsOf } from '../items/tags-of.js';
import { fromDateColumn } from './calendar-date.js';
import type { WearLogView } from './outfits.interfaces.js';

/** The rows the generator can use: those whose stored tags still pass today's vocabularies. */
export function outfitItemsOf(rows: readonly Item[]): OutfitItem[] {
  return rows.flatMap((row) => {
    const parsed = outfitItemSchema.safeParse({ ...tagsOf(row), id: row.id });
    // A row from before a vocabulary changed is left out rather than failing the request.
    return parsed.success ? [parsed.data] : [];
  });
}

export function wearLogView(log: WearLog): WearLogView {
  return { id: log.id, outfitId: log.outfitId, date: fromDateColumn(log.date) };
}

export function slotRank(slot: string): number {
  return OUTFIT_SLOT_ORDER.indexOf(slot as Slot);
}
