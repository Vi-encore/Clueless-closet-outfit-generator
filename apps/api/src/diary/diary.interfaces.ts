import type { Prisma } from '../generated/prisma/client.js';
import type { OutfitView } from '../outfits/outfits.interfaces.js';
import type { MEMORY_KINDS } from './diary.constants.js';

/** A month's days as a half-open range: `from <= date < to`, both `YYYY-MM-DD`. */
export interface MonthRange {
  from: string;
  to: string;
}

/** The days a memory looks back to, or null where that day did not exist. */
export interface MemoryDates {
  year: string | null;
  month: string | null;
}

/** What `CLOCK` provides: the moment it is now. */
export type Clock = () => Date;

/** How long ago a memory is from. */
export type MemoryKind = (typeof MEMORY_KINDS)[number];

/** A day of the diary as the API answers it. */
export interface DiaryEntry {
  id: string;
  /** A calendar date, `YYYY-MM-DD`, in the person's time zone. */
  date: string;
  note: string | null;
  /** A link to the person's photo of the day, or null when there is none. */
  photoUrl: string | null;
  outfit: OutfitView;
}

/** A day of the diary seen again, and how long ago it was. */
export interface Memory {
  kind: MemoryKind;
  entry: DiaryEntry;
}

/** A wear record read together with its outfit and the outfit's items. */
export type StoredEntry = Prisma.WearLogGetPayload<{
  include: { outfit: { include: { items: { include: { item: true } } } } };
}>;
