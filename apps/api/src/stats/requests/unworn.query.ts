import { z } from 'zod';
import { pageQuerySchema } from '../../pagination.constants.js';
import { DEFAULT_UNWORN_DAYS, UNWORN_DAYS } from '../stats.constants.js';
import { decodeCursor } from '../stats.utils.js';

/**
 * What `GET /stats/unworn` accepts: how long unworn, one of three, and a page as the
 * wardrobe's are. The cursor is not a uuid here but the API's own opaque string, so a
 * cursor it did not write is refused before the query is ever built.
 */
export const unwornQuerySchema = z.object({
  days: z.enum(UNWORN_DAYS).default(DEFAULT_UNWORN_DAYS).transform(Number),
  limit: pageQuerySchema.shape.limit,
  cursor: z
    .string()
    .refine((cursor) => decodeCursor(cursor) !== null, { error: 'Not a cursor this API issued' })
    .optional(),
});

export type UnwornQuery = z.infer<typeof unwornQuerySchema>;
