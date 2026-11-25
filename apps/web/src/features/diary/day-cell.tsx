import { Link } from 'react-router';
import { uk } from '../../shared/i18n/uk';
import { DollFigure } from '../outfits';
import type { DayCellProps } from './diary.interfaces';

/**
 * One day of the calendar. A day with records shows the first photo among them, or else
 * a small doll in its first outfit, and is a link to the day; how many outfits there were
 * is in the link's name, and in a corner when there is more than one.
 */
export function DayCell({ date, entries, isToday }: DayCellProps) {
  const number = Number(date.slice(8));
  const shown = entries.find((entry) => entry.photoUrl !== null) ?? entries[0];

  return (
    <td className="diary-day" aria-current={isToday ? 'date' : undefined}>
      {shown === undefined ? (
        <span className="diary-day-number">{number}</span>
      ) : (
        <Link
          to={`/diary/${date}`}
          aria-label={uk.diary.dayLink(date, entries.length)}
          className="diary-day-link"
        >
          <span className="diary-day-number">{number}</span>
          {shown.photoUrl !== null ? (
            <img src={shown.photoUrl} alt={uk.diary.photo} loading="lazy" className="diary-photo" />
          ) : (
            <span className="diary-doll">
              <DollFigure items={shown.outfit.items} />
            </span>
          )}
          {entries.length > 1 && (
            <span className="diary-day-count" aria-hidden="true">
              {entries.length}
            </span>
          )}
        </Link>
      )}
    </td>
  );
}
