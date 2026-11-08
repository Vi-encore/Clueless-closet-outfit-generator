import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { Page } from '../api/api.interfaces';

/** An infinite query over a list the API answers a page at a time. */
export type PagedQuery<T> = UseInfiniteQueryResult<InfiniteData<Page<T>, unknown>>;

/** What a screen draws from a list read a page at a time. */
export interface ShownPages<T> {
  items: T[];
  hasMore: boolean;
  /** The first page or the latest next one could not be loaded. */
  failed: boolean;
  /** What stopped the first page, for a screen that answers a 404 differently. */
  error: unknown;
  loading: boolean;
  more: () => void;
}
