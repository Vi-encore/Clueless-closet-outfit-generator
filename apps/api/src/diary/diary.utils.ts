import type { MemoryDates, MonthRange } from './diary.interfaces.js';

/**
 * Calendar days as `YYYY-MM-DD` strings, and nothing else: the diary's dates are days in a
 * person's own time zone (data-model.md, WearLog), and a `Date` in the middle would bring a
 * time zone back in.
 */

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** How many days a month has; `month` from 1 to 12. */
function daysIn(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function dayOf(year: number, month: number, day: number): string | null {
  return day <= daysIn(year, month) ? `${year}-${pad(month)}-${pad(day)}` : null;
}

/** The first day of a month, `YYYY-MM`, and the first day after it: `from <= date < to`. */
export function monthRange(month: string): MonthRange {
  const [year = 0, number = 0] = month.split('-').map(Number);
  const nextYear = number === 12 ? year + 1 : year;
  const next = number === 12 ? 1 : number + 1;

  return { from: `${month}-01`, to: `${nextYear}-${pad(next)}-01` };
}

/**
 * The same day a year and a month before `today`, or null where that day did not exist:
 * 31 March has no day a month before, and 29 February none a year before, unless that
 * year was a leap year too. A memory of a different day would not be "a year ago today".
 */
export function memoryDates(today: string): MemoryDates {
  const [year = 0, month = 0, day = 0] = today.split('-').map(Number);
  const previousMonth = month === 1 ? 12 : month - 1;
  const itsYear = month === 1 ? year - 1 : year;

  return { year: dayOf(year - 1, month, day), month: dayOf(itsYear, previousMonth, day) };
}
