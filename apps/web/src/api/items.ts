import type { Slot } from '@closet/core';
import { request } from './client';
import type { Item, Page } from './api.interfaces';

/** Fewer than the API's default: every one of these is a whole photograph on a phone. */
const PAGE_SIZE = 24;

interface ItemQuery {
  slot?: Slot | undefined;
  cursor?: string | undefined;
}

export function listItems({ slot, cursor }: ItemQuery): Promise<Page<Item>> {
  const query = new URLSearchParams({ limit: String(PAGE_SIZE) });

  if (slot !== undefined) {
    query.set('slot', slot);
  }

  if (cursor !== undefined) {
    query.set('cursor', cursor);
  }

  return request<Page<Item>>(`/items?${query.toString()}`);
}
