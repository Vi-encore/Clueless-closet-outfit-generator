import { request } from '../../shared/api/client';
import type { DiaryEntry } from './diary.interfaces';

/** The person's records in one month, `YYYY-MM`, in date order. */
export function listMonth(month: string): Promise<DiaryEntry[]> {
  return request<DiaryEntry[]>(`/diary?${new URLSearchParams({ month }).toString()}`);
}
