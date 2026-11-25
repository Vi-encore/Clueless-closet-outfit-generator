import { PHOTO_CONTENT_TYPES } from '@closet/core';
import { z } from 'zod';

/**
 * What `POST /diary/upload-url` accepts: the same image types as an item's photo. The type
 * is signed into the URL and decides the extension the object is filed under.
 */
export const diaryUploadUrlRequestSchema = z.object({
  contentType: z.enum(PHOTO_CONTENT_TYPES),
});

export type DiaryUploadUrlRequest = z.infer<typeof diaryUploadUrlRequestSchema>;
