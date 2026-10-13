import { z } from 'zod';
import { itemTagsSchema } from './item-tags.js';

/**
 * JSON Schema of item tags, generated from the zod schema (and so from the vocabularies).
 * Used later to constrain AI tag suggestions. Cross-field rules (refinements) can't be
 * expressed in JSON Schema, so they're left out — answers are re-validated with zod anyway.
 */
export function getItemTagsJsonSchema() {
  return z.toJSONSchema(itemTagsSchema, { unrepresentable: 'any' });
}
