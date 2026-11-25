import { uk } from '../../shared/i18n/uk';
import { DayCell } from './day-cell';
import type { MonthGridProps } from './diary.interfaces';
import { byDate, weeksOf } from './diary.utils';

/** The month as a table of Monday-first weeks: a calendar is tabular, and reads as one. */
export function MonthGrid({ month, entries, today, loading }: MonthGridProps) {
  const days = byDate(entries);

  return (
    <table className="diary-calendar" aria-label={uk.diary.calendar} aria-busy={loading}>
      <thead>
        <tr>
          {uk.diary.weekdays.map((weekday) => (
            <th key={weekday} scope="col">
              {weekday}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeksOf(month).map((week) => (
          <tr key={week.find((day) => day !== null)}>
            {week.map((date, index) =>
              date === null ? (
                // Padding before the 1st and after the last day: nothing to read there.
                <td key={`empty-${index}`} aria-hidden="true" />
              ) : (
                <DayCell
                  key={date}
                  date={date}
                  entries={days.get(date) ?? []}
                  isToday={date === today}
                />
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
