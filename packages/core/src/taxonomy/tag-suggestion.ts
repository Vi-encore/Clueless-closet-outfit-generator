import { z } from 'zod';
import { typeBelongsToSlot } from './slots.js';
import type { SuggestedTag } from './taxonomy.interfaces.js';
import { SUGGESTED_TAGS, tagSuggestionSchema, type TagSuggestion } from './taxonomy.constants.js';

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
