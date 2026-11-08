import type { Slot } from '@closet/core';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { nextPage } from '../../shared/api/pages';
import { findItem, listItems } from './wardrobe.api';
import type { Item, ItemPages } from './wardrobe.interfaces';

/**
 * Where the wardrobe lives in the cache. Broadest first, so that one prefix reaches
 * everything under it: `all` is every item and list, `lists` every narrowing of the
 * wardrobe, and an item's own key sits beside them.
 */
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (slot: Slot | undefined) => [...itemKeys.lists(), { slot }] as const,
  one: (id: string) => [...itemKeys.all, id] as const,
};

/** The wardrobe, a page at a time; every slot is its own list. */
export function wardrobeQuery(slot: Slot | undefined) {
  return infiniteQueryOptions({
    queryKey: itemKeys.list(slot),
    queryFn: ({ pageParam }) => listItems({ slot, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextPage<Item>,
  });
}

export function itemQuery(id: string) {
  return queryOptions({
    queryKey: itemKeys.one(id),
    queryFn: () => findItem(id),
  });
}

/**
 * A wardrobe list without one item, for the moment between archiving it and the API
 * answering the list again: the wardrobe a person returns to should not still have it.
 */
export function withoutItem(id: string) {
  return (pages: ItemPages | undefined): ItemPages | undefined =>
    pages && {
      ...pages,
      pages: pages.pages.map((page) => ({
        ...page,
        items: page.items.filter((item) => item.id !== id),
      })),
    };
}
