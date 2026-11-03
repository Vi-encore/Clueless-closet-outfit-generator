import { z } from 'zod';
import { itemTagsSchema, scaleSchema } from '../taxonomy/item-tags.js';
import { OCCASIONS } from '../taxonomy/vocabularies.js';
import { COMPONENTS } from './components.js';

/** Component weights. A missing component counts as weight 1, so every key is optional. */
const weightsSchema = z.partialRecord(z.enum(COMPONENTS), z.number().min(0));

/** What an outfit is scored against: the formality to aim for and how much each component matters. */
export const occasionSchema = z.object({
  code: z.enum(OCCASIONS),
  /** 1 (home) … 5 (black tie). */
  targetFormality: scaleSchema,
  weights: weightsSchema.optional(),
});

/**
 * An item taking part in an outfit: its tags plus an id that explanations can point at.
 * `safeExtend` is required instead of `.extend()`, which throws on a schema carrying
 * refinements — `itemTagsSchema` checks that the type belongs to its slot.
 */
export const outfitItemSchema = itemTagsSchema.safeExtend({
  id: z.string().trim().min(1),
});

export type Occasion = z.infer<typeof occasionSchema>;
export type OutfitItem = z.infer<typeof outfitItemSchema>;
