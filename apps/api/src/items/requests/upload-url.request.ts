import { PHOTO_CONTENT_TYPES } from '@closet/core';
import { z } from 'zod';

/**
 * What `POST /items/upload-url` accepts.
 *
 * The content type is not a formality: it is signed into the URL, so the file
 * that follows must be exactly what was asked for, and it decides the extension
 * the object is filed under.
 */
export const uploadUrlRequestSchema = z.object({
  contentType: z.enum(PHOTO_CONTENT_TYPES),
});

export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;
