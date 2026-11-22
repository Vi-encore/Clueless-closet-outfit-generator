import type { Outfit } from '../outfits';

/** A day of the diary as the API answers it: one outfit worn on one date. */
export interface DiaryEntry {
  id: string;
  /** A calendar date, `YYYY-MM-DD`, in the person's time zone. */
  date: string;
  note: string | null;
  /** A link to the person's photo of the day, or null when there is none. */
  photoUrl: string | null;
  outfit: Outfit;
}

export interface MonthGridProps {
  /** `YYYY-MM`. */
  month: string;
  entries: readonly DiaryEntry[];
  /** `YYYY-MM-DD`, marked in the grid when it falls in this month. */
  today: string;
  /** True while the month's records are on their way: the grid is drawn empty meanwhile. */
  loading: boolean;
}

export interface DayCellProps {
  /** `YYYY-MM-DD`. */
  date: string;
  /** That day's records, in the order the API answered them. */
  entries: readonly DiaryEntry[];
  isToday: boolean;
}
