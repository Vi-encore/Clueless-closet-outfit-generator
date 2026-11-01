import { itemTagsSchema, visibilitySchema } from '@closet/core';
import { z } from 'zod';

/**
 * What `POST /items` accepts.
 *
 * The tags arrive from `itemTagsSchema` unchanged - every vocabulary and the slot/type
 * rule included - and this adds only the columns a person fills in by hand. The rest of
 * the table is written by something other than its owner: the photo pipeline, the
 * tagger, the wear log, or the service itself.
 *
 * `.safeExtend()` and not `.extend()`: `itemTagsSchema` carries a `superRefine`, and
 * plain `.extend()` throws on a schema that has checks.
 */
export const createItemRequestSchema = itemTagsSchema.safeExtend({
  brand: z.string().trim().min(1).max(80).optional(),
  size: z.string().trim().min(1).max(20).optional(),
  /** The column is `Decimal(10, 2)`, so eight digits is as large as a price can be. */
  price: z.number().nonnegative().max(99_999_999).optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, { error: 'Expected a currency code like UAH' })
    .optional(),
  purchasedAt: z.coerce.date().optional(),
  notes: z.string().trim().min(1).max(2000).optional(),
  visibility: visibilitySchema.optional(),
  /**
   * The key a previous `POST /items/upload-url` handed out. Required: an item nobody can
   * see is no use to the doll or the generator, and a rule kept only in the form would
   * have to be remembered by the next client.
   *
   * Only its shape is checked here. Whether it was issued to the person sending
   * it is a question this schema cannot ask, because it does not know who that
   * is - the service does, and refuses there.
   */
  photoOriginalKey: z.string().trim().min(1).max(200),
});

export type CreateItemRequest = z.infer<typeof createItemRequestSchema>;
