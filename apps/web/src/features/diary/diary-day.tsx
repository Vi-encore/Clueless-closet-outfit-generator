import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { uk } from '../../shared/i18n/uk';
import { NotFound } from '../../shared/ui/not-found';
import { Window } from '../../shared/ui/window';
import { monthQuery } from './diary.queries';
import { isDate, monthOf } from './diary.utils';
import { EntryEditor } from './entry-editor';

/**
 * One day of the diary, at `/diary/YYYY-MM-DD`. No route answers a single record, and the
 * month is nearly always cached already, since a person comes here from the calendar: so
 * the day reads its month and keeps its own date's records.
 */
export function DiaryDay() {
  const { date = '' } = useParams();
  const valid = isDate(date);
  const { data, error } = useQuery({ ...monthQuery(monthOf(date)), enabled: valid });

  if (!valid) {
    return <NotFound />;
  }

  const entries = data?.filter((entry) => entry.date === date);

  return (
    <Window title={uk.diary.dayTitle(date)} parent={`/diary?month=${monthOf(date)}`} wide>
      {error !== null && <p role="alert">{uk.errors.unavailable}</p>}
      {entries !== undefined && entries.length === 0 && <p>{uk.diary.nothing}</p>}
      {entries !== undefined && entries.length > 0 && (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <EntryEditor key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </Window>
  );
}
