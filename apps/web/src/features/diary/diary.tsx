import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { uk } from '../../shared/i18n/uk';
import { Window } from '../../shared/ui/window';
import { monthQuery } from './diary.queries';
import { currentMonth, isMonth, monthTitle, shiftMonth, todayOf } from './diary.utils';
import { MonthGrid } from './month-grid';

/**
 * A month of the diary. The month is in the address, so a day's screen can lead back to
 * it and a link to it can be shared with oneself; one that cannot be read is this month.
 */
export function Diary() {
  const [params] = useSearchParams();
  const asked = params.get('month');
  // Read once, when the screen opens: a calendar left open past midnight keeps its day.
  const [now] = useState(() => new Date());
  const month = isMonth(asked) ? asked : currentMonth(now);
  const { data, error, isPending } = useQuery(monthQuery(month));

  return (
    <Window title={uk.diary.title} parent="/" wide>
      <nav className="mb-2 flex items-center justify-between gap-2">
        <Link
          to={`/diary?month=${shiftMonth(month, -1)}`}
          aria-label={uk.diary.previous}
          className="secondary"
        >
          ◀
        </Link>
        <h2 className="m-0 text-base first-letter:uppercase">{monthTitle(month)}</h2>
        <Link
          to={`/diary?month=${shiftMonth(month, 1)}`}
          aria-label={uk.diary.next}
          className="secondary"
        >
          ▶
        </Link>
      </nav>
      {error !== null && <p role="alert">{uk.errors.unavailable}</p>}
      <MonthGrid
        month={month}
        entries={data ?? []}
        today={todayOf(now)}
        loading={isPending && error === null}
      />
    </Window>
  );
}
