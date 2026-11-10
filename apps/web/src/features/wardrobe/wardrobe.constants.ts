import type { WardrobeFilter } from './wardrobe.interfaces';

/** Thrown by the archive form and read back in `describeArchiveFailure`, like anything else that stops it. */
export const NO_REASON = new Error('No reason was chosen');

/** Thrown by the new item form and read back in `describeNewItemFailure`, like anything else that stops it. */
export const NO_PHOTO = new Error('No photograph was chosen');

export const BAD_TAGS = new Error('The tags break a rule of the vocabularies');

/**
 * Where the wardrobe lives in the cache. Broadest first, so that one prefix reaches
 * everything under it: `all` is every item and list, `lists` every narrowing of the
 * wardrobe, and an item's own key sits beside them.
 */
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: ({ slot, status }: WardrobeFilter) => [...itemKeys.lists(), { slot, status }] as const,
  one: (id: string) => [...itemKeys.all, id] as const,
};
