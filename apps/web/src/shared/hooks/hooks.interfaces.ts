import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { Page } from '../api/api.interfaces';
export type Load<T> = () => Promise<T>;

export interface Arrived<T> {
  source: Load<T>;
  value: T | null;
  error: unknown;
}

export type LoadPage<T> = (cursor?: string) => Promise<Page<T>>;

/** What has arrived, and which `load` it came from. */
export interface ArrivedPages<T> extends Page<T> {
  source: LoadPage<T>;
  failed: boolean;
  /** What stopped the first page, for a screen that answers a 404 differently. */
  error: unknown;
}

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
