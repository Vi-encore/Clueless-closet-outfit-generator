import { occasionSchema, outfitItemSchema } from '@closet/core';
import { z } from 'zod';

/** An outfit is a handful of items; more than this is a wardrobe, not an outfit. */
export const MAX_ITEMS = 6;

/**
 * What `POST /outfits/score` accepts. Both halves come from `@closet/core`, so the API
 * cannot drift from the rules that do the scoring.
 *
 * Ids must be distinct: they exist so an explanation can point at one item, and two items
 * sharing an id would make every explanation ambiguous.
 */
export const scoreOutfitRequestSchema = z.object({
  occasion: occasionSchema,
  items: z
    .array(outfitItemSchema)
    .min(1)
    .max(MAX_ITEMS)
    .refine((items) => new Set(items.map((item) => item.id)).size === items.length, {
      error: 'Item ids must not repeat',
    }),
});

export type ScoreOutfitRequest = z.infer<typeof scoreOutfitRequestSchema>;
