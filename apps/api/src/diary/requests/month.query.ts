import { z } from 'zod';

/** What `GET /diary` accepts: one month, `YYYY-MM`. */
export const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(?:0[1-9]|1[0-2])$/, { error: 'Expected a month like 2026-03' }),
});

export type MonthQuery = z.infer<typeof monthQuerySchema>;
