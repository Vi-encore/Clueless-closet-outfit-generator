import { itemTagsSchema } from '@closet/core';
import type { Item } from '../generated/prisma/client.js';

/**
 * The stored row reduced to the tags `itemTagsSchema` describes.
 *
 * Two translations happen here. The row carries columns the schema knows nothing
 * about, and it answers `null` where a tag was never filled in - while an optional
 * field accepts `undefined` and refuses `null`. Feeding the row in untouched would
 * fail on every tag the owner has not got round to yet.
 */
export function tagsOf(item: Item): Record<string, unknown> {
  const tags: Record<string, unknown> = {};

  for (const key of Object.keys(itemTagsSchema.shape)) {
    const value = (item as unknown as Record<string, unknown>)[key];

    if (value !== null && value !== undefined) {
      tags[key] = value;
    }
  }

  return tags;
}
