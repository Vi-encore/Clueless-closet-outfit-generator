import { randomUUID } from 'node:crypto';
import type { PhotoContentType } from '@closet/core';

/** What each content type a photograph may arrive as is filed under. */
const EXTENSIONS: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
} satisfies Record<PhotoContentType, string>;

/**
 * Where a photograph is filed: `items/<ownerId>/<uuid>.<ext>`.
 *
 * The key is deliberately not opaque. An upload URL is issued before the item
 * exists, so the key travels out through the client and comes back on the request
 * that creates the item - where it could be any string at all. Naming the owner
 * in it means a key captured from somebody else cannot be attached to your own
 * item, and the uuid means nobody can guess one in the first place. Either half
 * alone leaves a hole.
 */
export function keyFor(ownerId: string, contentType: string): string {
  const extension = EXTENSIONS[contentType];

  if (extension === undefined) {
    throw new Error(`No extension is known for ${contentType}`);
  }

  return `items/${ownerId}/${randomUUID()}.${extension}`;
}

/** The owner a key names, or null when it is not a key this API ever issued. */
export function ownerOf(key: string): string | null {
  const match = /^items\/([0-9a-f-]{36})\/[0-9a-f-]{36}\.(?:webp|jpg|png)$/.exec(key);

  return match?.[1] ?? null;
}
