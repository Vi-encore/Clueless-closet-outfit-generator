import { OCCASIONS } from '@closet/core';
import { z } from 'zod';
import { MAX_ITEMS } from '../score-outfit.request.js';

/** How many shown outfits "another one" may name; enough for a long evening of asking. */
export const MAX_SEEN = 50;

/**
 * What `POST /outfits/generate` accepts. Both lists are capped, so a request cannot make
 * the server read a whole table.
 */
export const generateOutfitRequestSchema = z.object({
  occasion: z.enum(OCCASIONS),
  /** Ids of the person's items every outfit must hold. */
  mustInclude: z.array(z.uuid()).max(MAX_ITEMS).optional(),
  /** Ids of the person's outfits already shown, none of which may come back. */
  seen: z.array(z.uuid()).max(MAX_SEEN).optional(),
});

export type GenerateOutfitRequest = z.infer<typeof generateOutfitRequestSchema>;
