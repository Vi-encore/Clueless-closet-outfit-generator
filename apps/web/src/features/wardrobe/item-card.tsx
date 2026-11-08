import { ARCHIVE_REASONS } from '@closet/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { useParams } from 'react-router';
import { hasStatus } from '../../shared/api/api-error';
import type {
  ArchiveFields,
  ArchiveFormProps,
  ItemSheetProps,
  SharingSwitchProps,
} from './wardrobe.interfaces';
import { archiveItem, setVisibility } from './wardrobe.api';
import { itemKeys, itemQuery, withoutItem } from './wardrobe.queries';
import type { Item, ItemPages } from './wardrobe.interfaces';
import { uk } from '../../shared/i18n/uk';
import { ErrorDialog } from '../../shared/ui/error-dialog';
import { useClose } from '../../shared/hooks/use-close';
import { useFormSubmit } from '../../shared/hooks/use-form-submit';
import { Window } from '../../shared/ui/window';
import { NotFound } from '../../shared/ui/not-found';

export function ItemCard() {
  const { id = '' } = useParams();
  const { data: item, error } = useQuery(itemQuery(id));

  // Somebody else's item and no item at all are one answer from the API, by design,
  // and this keeps them one answer on screen.
  if (hasStatus(error, 404) || hasStatus(error, 400)) {
    return <NotFound />;
  }

  if (error !== null) {
    return (
      <Window title={uk.wardrobe.title} parent="/wardrobe">
        <p role="alert">{uk.errors.unavailable}</p>
      </Window>
    );
  }

  return item === undefined ? null : <Sheet item={item} />;
}

function Sheet({ item }: ItemSheetProps) {
  const name = item.name ?? uk.types[item.type];

  return (
    <Window title={name} parent="/wardrobe" wide>
      <div className="sheet flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {item.photoUrl !== null && (
          <img
            className="item-photo max-h-[50dvh] w-auto sm:max-w-1/2"
            src={item.photoUrl}
            alt={name}
          />
        )}
        <div className="flex flex-col gap-4 self-stretch sm:flex-1">
          <dl className="details">
            <dt>{uk.item.slot}</dt>
            <dd>{uk.slots[item.slot]}</dd>
            <dt>{uk.item.type}</dt>
            <dd>{uk.types[item.type]}</dd>
            <dt>{uk.item.visibility}</dt>
            <dd>{uk.visibility[item.visibility]}</dd>
          </dl>
          <SharingSwitch item={item} />
          {item.status !== 'archived' && <ArchiveForm id={item.id} />}
        </div>
      </div>
    </Window>
  );
}

/**
 * The API answers with the whole item, so the answer goes straight into the cache: the
 * card shows it, and so does the card opened again later, before anything is asked.
 */
function SharingSwitch({ item }: SharingSwitchProps) {
  const id = useId();
  const queryClient = useQueryClient();
  const sharing = useMutation({
    mutationFn: (shared: boolean) => setVisibility(item.id, shared ? 'friends' : 'private'),
    onSuccess: (answer: Item) => {
      queryClient.setQueryData(itemKeys.one(answer.id), answer);
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
    },
  });

  return (
    <div className="field-row">
      <input
        id={id}
        type="checkbox"
        checked={item.visibility === 'friends'}
        disabled={sharing.isPending}
        onChange={(event) => sharing.mutate(event.target.checked)}
      />
      <label htmlFor={id}>{uk.item.share}</label>
      {sharing.isError && (
        <ErrorDialog message={uk.errors.unavailable} onClose={() => sharing.reset()} />
      )}
    </div>
  );
}

/** Thrown here and read back in `describe`, like anything else that stops the form. */
const NO_REASON = new Error('No reason was chosen');

function describe(error: unknown): string {
  return error === NO_REASON ? uk.item.noReason : uk.errors.unavailable;
}

function ArchiveForm({ id }: ArchiveFormProps) {
  const close = useClose('/wardrobe');
  const queryClient = useQueryClient();
  const reasonId = useId();
  const { onSubmit, pending, failure, dismiss } = useFormSubmit<ArchiveFields>(
    async ({ reason }) => {
      // No default on purpose: the statistics count how clothes really end, and a
      // reason nobody chose would look exactly like one somebody did.
      if (reason === '') {
        throw NO_REASON;
      }

      const archived = await archiveItem(id, reason);

      // Gone from every list at once, and the lists asked again behind that.
      queryClient.setQueryData(itemKeys.one(id), archived);
      queryClient.setQueriesData<ItemPages>({ queryKey: itemKeys.lists() }, withoutItem(id));
      void queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      close();
    },
    describe,
  );

  return (
    <form className="well flex flex-col gap-2" onSubmit={onSubmit}>
      <p>{uk.item.archiveNote}</p>
      <div className="field-row-stacked">
        <label htmlFor={reasonId}>{uk.item.reason}</label>
        <select id={reasonId} name="reason" defaultValue="">
          <option value="">{uk.item.chooseReason}</option>
          {ARCHIVE_REASONS.map((code) => (
            <option key={code} value={code}>
              {uk.archiveReasons[code]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="self-start" disabled={pending}>
        {uk.item.archive}
      </button>
      {failure !== null && <ErrorDialog message={failure} onClose={dismiss} />}
    </form>
  );
}
