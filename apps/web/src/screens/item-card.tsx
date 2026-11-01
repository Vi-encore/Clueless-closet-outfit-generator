import { ARCHIVE_REASONS, type ArchiveReason } from '@closet/core';
import { useCallback, useId, useState } from 'react';
import { useParams } from 'react-router';
import { hasStatus } from '../api/api-error';
import type { Item } from '../api/api.interfaces';
import { archiveItem, findItem, setVisibility } from '../api/items';
import { uk } from '../i18n/uk';
import { ErrorDialog } from '../shell/error-dialog';
import { useClose } from '../shell/use-close';
import { useFormSubmit } from '../shell/use-form-submit';
import { useLoad } from '../shell/use-load';
import { Window } from '../shell/window';
import { NotFound } from './not-found';

export function ItemCard() {
  const { id = '' } = useParams();
  const load = useCallback(() => findItem(id), [id]);
  const { value: item, error } = useLoad(load);

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

  // Keyed, so that opening another item starts from what that one says.
  return item === null ? null : <Sheet key={item.id} loaded={item} />;
}

function Sheet({ loaded }: { loaded: Item }) {
  const [item, setItem] = useState(loaded);
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
          <SharingSwitch item={item} onChange={setItem} />
          {item.status !== 'archived' && <ArchiveForm id={item.id} />}
        </div>
      </div>
    </Window>
  );
}

function SharingSwitch({ item, onChange }: { item: Item; onChange: (item: Item) => void }) {
  const id = useId();
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const change = (shared: boolean) => {
    setPending(true);
    setVisibility(item.id, shared ? 'friends' : 'private')
      .then(onChange, () => setFailure(uk.errors.unavailable))
      .finally(() => setPending(false));
  };

  return (
    <div className="field-row">
      <input
        id={id}
        type="checkbox"
        checked={item.visibility === 'friends'}
        disabled={pending}
        onChange={(event) => change(event.target.checked)}
      />
      <label htmlFor={id}>{uk.item.share}</label>
      {failure !== null && <ErrorDialog message={failure} onClose={() => setFailure(null)} />}
    </div>
  );
}

/** Thrown here and read back in `describe`, like anything else that stops the form. */
const NO_REASON = new Error('No reason was chosen');

function describe(error: unknown): string {
  return error === NO_REASON ? uk.item.noReason : uk.errors.unavailable;
}

function ArchiveForm({ id }: { id: string }) {
  const close = useClose('/wardrobe');
  const reasonId = useId();
  const { onSubmit, pending, failure, dismiss } = useFormSubmit<{ reason: ArchiveReason | '' }>(
    async ({ reason }) => {
      // No default on purpose: the statistics count how clothes really end, and a
      // reason nobody chose would look exactly like one somebody did.
      if (reason === '') {
        throw NO_REASON;
      }

      await archiveItem(id, reason);
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
