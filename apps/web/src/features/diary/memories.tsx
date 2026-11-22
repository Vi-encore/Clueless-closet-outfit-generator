import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { uk } from '../../shared/i18n/uk';
import { DollFigure } from '../outfits';
import { memoriesQuery } from './diary.queries';

/**
 * The same day a year or a month ago, on the desktop, each a link to that day. Nothing at
 * all while it loads, when there is nothing to remember, or when the diary cannot be
 * reached: the desktop is where signing in lands, and a memory is never worth breaking it.
 */
export function Memories() {
  const { data } = useQuery(memoriesQuery());

  if (data === undefined || data.length === 0) {
    return null;
  }

  return (
    <section aria-label={uk.diary.memories} className="mt-4 flex flex-wrap gap-4">
      {data.map(({ kind, entry }) => (
        <Link
          key={`${kind}-${entry.id}`}
          to={`/diary/${entry.date}`}
          aria-label={uk.diary.memory[kind]}
          className="memory"
        >
          {entry.photoUrl !== null ? (
            <img src={entry.photoUrl} alt={uk.diary.photo} className="memory-photo" />
          ) : (
            <span className="memory-doll">
              <DollFigure items={entry.outfit.items} />
            </span>
          )}
          <span aria-hidden="true">{uk.diary.memory[kind]}</span>
        </Link>
      ))}
    </section>
  );
}
