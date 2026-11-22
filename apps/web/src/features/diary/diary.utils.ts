import { MONTH_TITLE } from './diary.constants';
import type { DiaryEntry } from './diary.interfaces';

const pad = (value: number) => String(value).padStart(2, '0');

const partsOf = (month: string) => month.split('-').map(Number) as [number, number];

/**
 * The month as Monday-first weeks of `YYYY-MM-DD`, padded with null before the 1st and
 * after the last day. Computed in UTC, where a date string means what it says.
 */
export function weeksOf(month: string): (string | null)[][] {
  const [year, number] = partsOf(month);
  const length = new Date(Date.UTC(year, number, 0)).getUTCDate();
  // getUTCDay counts from Sunday; a Monday-first week puts Sunday last.
  const before = (new Date(Date.UTC(year, number - 1, 1)).getUTCDay() + 6) % 7;
  const days: (string | null)[] = [
    ...Array<null>(before).fill(null),
    ...Array.from({ length }, (_, index) => `${month}-${pad(index + 1)}`),
  ];

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return Array.from({ length: days.length / 7 }, (_, week) => days.slice(week * 7, week * 7 + 7));
}

/** The month `by` months away, across years. */
export function shiftMonth(month: string, by: number): string {
  const [year, number] = partsOf(month);
  const shifted = new Date(Date.UTC(year, number - 1 + by, 1));

  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}`;
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** The browser's own calendar month: what a person means by "this month". */
export function currentMonth(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

/** The browser's own calendar date. */
export function todayOf(now: Date): string {
  return `${currentMonth(now)}-${pad(now.getDate())}`;
}

/** The address is typed by anybody, so a month from it is only believed if it is one. */
export function isMonth(text: string | null): text is string {
  return text !== null && /^\d{4}-(?:0[1-9]|1[0-2])$/.test(text);
}

export function monthTitle(month: string): string {
  const [year, number] = partsOf(month);

  return MONTH_TITLE.format(new Date(Date.UTC(year, number - 1, 1, 12)));
}

/** The records grouped by their date, each day's in the order they came. */
export function byDate(entries: readonly DiaryEntry[]): Map<string, DiaryEntry[]> {
  const days = new Map<string, DiaryEntry[]>();

  for (const entry of entries) {
    days.set(entry.date, [...(days.get(entry.date) ?? []), entry]);
  }

  return days;
}
