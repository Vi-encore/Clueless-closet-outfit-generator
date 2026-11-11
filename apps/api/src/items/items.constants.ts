import { z } from 'zod';

/**
 * Ids are checked for shape before they reach Prisma: the column is `uuid`, and a
 * query against it with something that is not one fails in the driver rather than
 * returning nothing, which would turn a mistyped URL into a 500.
 */
export const itemIdSchema = z.uuid();
