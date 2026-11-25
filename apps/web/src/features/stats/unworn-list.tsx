import { useInfiniteQuery } from '@tanstack/react-query';
import { useId } from 'react';
import { useSearchParams } from 'react-router';
import { shownPages } from '../../shared/hooks/shown-pages';
import { uk } from '../../shared/i18n/uk';
import { Sheet } from '../../shared/ui/sheet';
import { UNWORN_DAYS } from './stats.constants';
import type { UnwornListProps } from './stats.interfaces';
import { unwornQuery } from './stats.queries';
import { UnwornRow } from './unworn-row';

/**
 * The items not worn for 30, 90 or 180 days, the longest first, a dozen at a time. The
 * choice is in the address, as the outfit screen keeps its occasion, so the list can be
 * come back to as it was.
 */
export function UnwornList({ days }: UnwornListProps) {
  const [, setParams] = useSearchParams();
  const daysId = useId();
  const { items, hasMore, failed, loading, more } = shownPages(useInfiniteQuery(unwornQuery(days)));

  return (
    <Sheet title={uk.stats.unwornTitle}>
      <div className="field-row">
        <label htmlFor={daysId}>{uk.stats.unwornDays}</label>
        <select
          id={daysId}
          value={days}
          onChange={(event) =>
            setParams(
              (current) => {
                const next = new URLSearchParams(current);
                next.set('days', event.target.value);
                return next;
              },
              { replace: true },
            )
          }
        >
          {UNWORN_DAYS.map((choice) => (
            <option key={choice} value={choice}>
              {uk.stats.days(Number(choice))}
            </option>
          ))}
        </select>
      </div>
      {failed && <p role="alert">{uk.errors.unavailable}</p>}
      {!loading && !failed && items.length === 0 && <p>{uk.stats.allWorn(Number(days))}</p>}
      {items.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-3">
          {items.map((line) => (
            <UnwornRow key={line.item.id} line={line} />
          ))}
        </ul>
      )}
      {hasMore && (
        <button type="button" className="secondary self-start" disabled={loading} onClick={more}>
          {uk.stats.more}
        </button>
      )}
    </Sheet>
  );
}
