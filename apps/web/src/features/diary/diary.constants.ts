/** The longest note the API keeps, counted after trimming as it counts. */
export const NOTE_LIMIT = 2000;

export const diaryKeys = {
  all: ['diary'] as const,
  month: (month: string) => [...diaryKeys.all, 'month', month] as const,
  memories: () => [...diaryKeys.all, 'memories'] as const,
};

/**
 * A month's title, its name and its year in Ukrainian. Read at noon UTC of the 1st, so no time zone
 * can move it into the month before.
 */
export const MONTH_TITLE = new Intl.DateTimeFormat('uk-UA', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
