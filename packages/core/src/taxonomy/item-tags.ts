import { z } from 'zod';
import {
  COLOR_FAMILIES,
  FABRIC_TYPES,
  FITS,
  ITEM_TYPES,
  LENGTHS,
  MATERIALS,
  OCCASIONS,
  PATTERNS,
  RISES,
  SCALE_MAX,
  SCALE_MIN,
  SEASONS,
  SLOTS,
  STYLES,
  typeBelongsToSlot,
} from './vocabularies.js';

/** The 1–5 scale used by warmth, formality and an occasion's formality target. */
export const scaleSchema = z.int().min(SCALE_MIN).max(SCALE_MAX);

/** An array whose values must not repeat. */
function distinct<T extends z.ZodType>(item: T) {
  return z.array(item).refine((values) => new Set(values).size === values.length, {
    error: 'Values must not repeat',
  });
}

export const colorSchema = z.object({
  family: z.enum(COLOR_FAMILIES),
  hex: z.string().regex(/^#[0-9a-f]{6}$/i, { error: 'Expected a color like #3b5b8c' }),
  /** Fraction of the item's visible area, 0–1. */
  share: z.number().min(0).max(1),
});

export const materialSchema = z.object({
  material: z.enum(MATERIALS),
  percent: z.int().min(1).max(100).optional(),
});

const materialsSchema = z
  .array(materialSchema)
  .refine((list) => new Set(list.map((entry) => entry.material)).size === list.length, {
    error: 'Materials must not repeat',
  })
  .refine((list) => list.reduce((sum, entry) => sum + (entry.percent ?? 0), 0) <= 100, {
    error: 'Percentages must add up to 100 or less',
  });

/**
 * The tags that describe one wardrobe item. Only `slot` and `type` are required;
 * everything else can be filled in later (scoring treats missing data as neutral).
 */
export const itemTagsSchema = z
  .object({
    slot: z.enum(SLOTS),
    type: z.enum(ITEM_TYPES),
    name: z.string().trim().min(1).max(80).optional(),
    colors: z.array(colorSchema).optional(),
    pattern: z.enum(PATTERNS).optional(),
    fabricType: z.enum(FABRIC_TYPES).optional(),
    materials: materialsSchema.optional(),
    fit: z.enum(FITS).optional(),
    length: z.enum(LENGTHS).optional(),
    rise: z.enum(RISES).optional(),
    seasons: distinct(z.enum(SEASONS)).optional(),
    warmth: scaleSchema.optional(),
    formality: scaleSchema.optional(),
    styles: distinct(z.enum(STYLES)).optional(),
    occasions: distinct(z.enum(OCCASIONS)).optional(),
    avoidOccasions: distinct(z.enum(OCCASIONS)).optional(),
  })
  .superRefine((item, ctx) => {
    if (!typeBelongsToSlot(item.type, item.slot)) {
      ctx.addIssue({
        code: 'custom',
        path: ['type'],
        message: `Type "${item.type}" does not belong to slot "${item.slot}"`,
        input: item.type,
      });
    }
  });

export type ItemTags = z.infer<typeof itemTagsSchema>;
export type ItemColor = z.infer<typeof colorSchema>;
export type ItemMaterial = z.infer<typeof materialSchema>;
