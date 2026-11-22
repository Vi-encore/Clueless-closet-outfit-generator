import { request } from '../../shared/api/client';
import type { Page } from '../../shared/api/api.interfaces';
import type { StatsSummary, UnwornLine } from './stats.interfaces';

/** A dozen at a time: each one is a photograph on a phone. */
const UNWORN_PAGE = 12;

export function getSummary(): Promise<StatsSummary> {
  return request<StatsSummary>('/stats');
}

/** One page of the items not worn for `days`, the longest unworn first. */
export function getUnworn(days: string, cursor: string | undefined): Promise<Page<UnwornLine>> {
  const query = new URLSearchParams({ days, limit: String(UNWORN_PAGE) });

  if (cursor !== undefined) {
    query.set('cursor', cursor);
  }

  return request<Page<UnwornLine>>(`/stats/unworn?${query.toString()}`);
}
