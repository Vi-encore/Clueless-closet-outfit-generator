import { z } from 'zod';

/**
 * What `PATCH /diary/:id` accepts. An absent field is left as it is, and null clears it.
 *
 * The note is trimmed first, so a note of spaces is no note, and the limit counts what is
 * kept rather than what was typed.
 */
export const updateEntryRequestSchema = z.object({
  note: z
    .string()
    .trim()
    .max(2000)
    .transform((note) => (note === '' ? null : note))
    .nullable()
    .optional(),
  /** A key a previous `POST /diary/upload-url` handed to this person. */
  photoKey: z.string().nullable().optional(),
});

export type UpdateEntryRequest = z.infer<typeof updateEntryRequestSchema>;
