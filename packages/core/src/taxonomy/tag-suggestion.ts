import { z } from 'zod';
import { itemTagsSchema } from './item-tags.js';
import { typeBelongsToSlot } from './vocabularies.js';
import type { SuggestedTag } from './taxonomy.interfaces.js';

const tags = itemTagsSchema.shape;

/**
 * What something other than a person thinks an item is: every tag an item has, each of
 * which may be null for "cannot tell", and the fields it is unsure of.
 *
 * Today the only thing that makes one is the color reader; in step 15 a model will make
 * the rest. Either way it only fills a form a person then checks, which is why nothing
 * in it is required - not even the slot and the type an item cannot be saved without.
 * Spelt out field by field rather than mapped from the shape, so that its type says
 * exactly what each field holds.
 */
export const tagSuggestionSchema = z.object({
  slot: tags.slot.nullable(),
  type: tags.type.nullable(),
  name: tags.name.unwrap().nullable(),
  colors: tags.colors.unwrap().nullable(),
  pattern: tags.pattern.unwrap().nullable(),
  fabricType: tags.fabricType.unwrap().nullable(),
  materials: tags.materials.unwrap().nullable(),
  fit: tags.fit.unwrap().nullable(),
  length: tags.length.unwrap().nullable(),
  rise: tags.rise.unwrap().nullable(),
  seasons: tags.seasons.unwrap().nullable(),
  warmth: tags.warmth.unwrap().nullable(),
  formality: tags.formality.unwrap().nullable(),
  styles: tags.styles.unwrap().nullable(),
  occasions: tags.occasions.unwrap().nullable(),
  avoidOccasions: tags.avoidOccasions.unwrap().nullable(),
  uncertain: z.array(z.string()),
});

export type TagSuggestion = z.infer<typeof tagSuggestionSchema>;

/** Every tag a suggestion can carry, in the order the form shows them. */
export const SUGGESTED_TAGS = Object.keys(tagSuggestionSchema.shape).filter(
  (field): field is SuggestedTag => field !== 'uncertain',
);

function isSuggestedTag(value: unknown): value is SuggestedTag {
  return SUGGESTED_TAGS.some((field) => field === value);
}

/**
 * Reads a suggestion nobody vouches for, one field at a time.
 *
 * A model's answer can be well formed and still wrong in one place - a pattern that is
 * not a code, or a type from another slot. Refusing the whole answer for that would
 * throw away the fields it got right, so each field that fails becomes null on its own,
 * and the slot/type rule, which needs both, gives up the type and keeps the slot.
 */
export function readSuggestion(input: unknown): TagSuggestion {
  const raw: Record<string, unknown> =
    typeof input === 'object' && input !== null ? { ...input } : {};

  const fields = Object.fromEntries(
    SUGGESTED_TAGS.map((field) => {
      const read = tagSuggestionSchema.shape[field].safeParse(raw[field]);

      return [field, read.success ? read.data : null];
    }),
  );

  const uncertain = Array.isArray(raw.uncertain) ? raw.uncertain.filter(isSuggestedTag) : [];

  // Always passes: every field is either what its own schema accepted or null.
  const suggestion = tagSuggestionSchema.parse({ ...fields, uncertain });

  if (
    suggestion.slot !== null &&
    suggestion.type !== null &&
    !typeBelongsToSlot(suggestion.type, suggestion.slot)
  ) {
    return { ...suggestion, type: null };
  }

  return suggestion;
}

/**
 * The suggestion as JSON Schema, for a model's structured output in step 15. Like the
 * tags' own, it cannot carry the slot/type rule, which `readSuggestion` applies after.
 */
export function getTagSuggestionJsonSchema() {
  return z.toJSONSchema(tagSuggestionSchema, { unrepresentable: 'any' });
}
