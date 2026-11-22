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
