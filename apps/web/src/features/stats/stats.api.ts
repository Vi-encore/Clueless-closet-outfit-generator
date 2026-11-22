import { request } from '../../shared/api/client';
import type { StatsSummary } from './stats.interfaces';

export function getSummary(): Promise<StatsSummary> {
  return request<StatsSummary>('/stats');
}
