import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId, useState, type ChangeEvent } from 'react';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { DollFigure } from '../outfits';
import { PhotoPreview } from '../wardrobe';
import { saveEntry } from './diary.api';
import { NOTE_LIMIT, diaryKeys } from './diary.constants';
import type { DiaryEntry, EntryEditorProps } from './diary.interfaces';
import { monthOf, photoChange } from './diary.utils';
import { useDayPhoto } from './use-day-photo';

/**
 * One outfit worn that day: the doll, the photo, and the note, all saved at once. The
 * answer replaces the record in its month, so the calendar shows it without asking again.
 */
export function EntryEditor({ entry }: EntryEditorProps) {
  const queryClient = useQueryClient();
  const noteId = useId();
  const fileId = useId();
  const [note, setNote] = useState(entry.note ?? '');
  const { photo, choose, remove, reset } = useDayPhoto();
  const saving = useMutation({
    mutationFn: () => saveEntry(entry.id, { note, photo: photoChange(photo) }),
    onSuccess: (answer) => {
      queryClient.setQueryData<DiaryEntry[]>(diaryKeys.month(monthOf(answer.date)), (days) =>
        days?.map((day) => (day.id === answer.id ? answer : day)),
      );
      void queryClient.invalidateQueries({ queryKey: diaryKeys.memories() });
      setNote(answer.note ?? '');
      reset();
    },
  });
  const tooLong = note.trim().length > NOTE_LIMIT;
  const hasPhoto =
    photo.step === 'chosen' || (photo.step === 'unchanged' && entry.photoUrl !== null);

  const chosen = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file !== undefined) {
      choose(file);
    }

    // So that choosing the same file again is still a choice.
    event.target.value = '';
  };

  return (
    <article className="flex flex-col gap-2 sm:flex-row">
      <div className="mx-auto w-32 shrink-0">
        <DollFigure items={entry.outfit.items} />
      </div>
      <form
        className="flex flex-1 flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          saving.mutate();
        }}
      >
        {photo.step === 'chosen' && <PhotoPreview image={photo.blob} alt={uk.diary.chosenPhoto} />}
        {photo.step === 'unchanged' && entry.photoUrl !== null && (
          <img src={entry.photoUrl} alt={uk.diary.photo} className="diary-day-photo" />
        )}
        {photo.step === 'reading' && <p>{uk.diary.reading}</p>}
        {photo.step === 'unreadable' && <p role="alert">{uk.diary.unreadable}</p>}
        <div className="flex flex-wrap gap-2">
          <label htmlFor={fileId} className="secondary">
            {uk.diary.choosePhoto}
          </label>
          <input id={fileId} className="sr-only" type="file" accept="image/*" onChange={chosen} />
          {hasPhoto && (
            <button type="button" onClick={remove}>
              {uk.diary.removePhoto}
            </button>
          )}
        </div>
        <div className="field-row-stacked">
          <label htmlFor={noteId}>{uk.diary.note}</label>
          <textarea
            id={noteId}
            rows={4}
            value={note}
            aria-invalid={tooLong}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
        {tooLong && <p role="alert">{uk.diary.noteTooLong(NOTE_LIMIT)}</p>}
        <button
          type="submit"
          className="action self-start"
          disabled={tooLong || photo.step === 'reading' || saving.isPending}
        >
          {uk.diary.save}
        </button>
        {saving.isSuccess && <output>{uk.diary.saved}</output>}
      </form>
      {saving.isError && (
        <ErrorDialog message={uk.diary.saveFailed} onClose={() => saving.reset()} />
      )}
    </article>
  );
}
