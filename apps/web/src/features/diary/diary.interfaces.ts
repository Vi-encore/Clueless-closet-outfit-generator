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

/** Where to send a photo: a signed address, and the key to give the record afterwards. */
export interface UploadTarget {
  key: string;
  url: string;
}

/** What `PATCH /diary/:id` is sent. No `photoKey` leaves the photo as it is; null removes it. */
export interface EntryPatch {
  note: string | null;
  photoKey?: string | null;
}

/** A day's note and photo as the person left them: a new photo, none, or the one there was. */
export interface EntryChanges {
  note: string;
  /** A blob to send, null to take the photo away, undefined to leave it. */
  photo: Blob | null | undefined;
}

/** The photo being chosen for a day, from the file to the blob that will be sent. */
export type DayPhoto =
  | { step: 'unchanged' }
  | { step: 'reading' }
  | { step: 'unreadable' }
  | { step: 'chosen'; blob: Blob }
  | { step: 'removed' };

export interface EntryEditorProps {
  entry: DiaryEntry;
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
