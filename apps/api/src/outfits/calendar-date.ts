/**
 * The calendar date, `YYYY-MM-DD`, that a moment falls on in a time zone.
 *
 * "What was worn on 2 March" is a day in the person's life, not in UTC: at 23:30 UTC on
 * 1 March it is already 2 March in Auckland and in Kyiv. `en-CA` is the locale whose
 * short date is exactly `YYYY-MM-DD`, so nothing has to be reassembled from parts.
 */
export function calendarDateIn(timeZone: string, moment: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(moment);
}

/**
 * A `YYYY-MM-DD` as the value a `@db.Date` column takes: midnight UTC of that day.
 * Built and read in UTC only, so no server time zone can move it to the day before.
 */
export function asDateColumn(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

/** The `YYYY-MM-DD` a `@db.Date` column was read back as. */
export function fromDateColumn(value: Date): string {
  return value.toISOString().slice(0, 10);
}
