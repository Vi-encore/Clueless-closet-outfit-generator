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
