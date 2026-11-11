import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { nextPage } from '../../shared/api/pages';
import { findItem, listItems } from './wardrobe.api';
import type { Item, ItemPages, WardrobeFilter } from './wardrobe.interfaces';
import { itemKeys } from './wardrobe.constants';

/**
 * The wardrobe, a page at a time; every slot is its own list, and so is the archive of
 * each. All of them sit under `lists()`, so a change that refreshes the wardrobe
 * refreshes the archive too.
 */
export function wardrobeQuery(filter: WardrobeFilter) {
  return infiniteQueryOptions({
    queryKey: itemKeys.list(filter),
    queryFn: ({ pageParam }) => listItems({ ...filter, cursor: pageParam }),
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
