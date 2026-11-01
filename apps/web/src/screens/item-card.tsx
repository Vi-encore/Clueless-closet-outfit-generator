import { useCallback } from 'react';
import { useParams } from 'react-router';
import { hasStatus } from '../api/api-error';
import { findItem } from '../api/items';
import { uk } from '../i18n/uk';
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

  if (item === null) {
    return null;
  }

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
        <dl className="details">
          <dt>{uk.item.slot}</dt>
          <dd>{uk.slots[item.slot]}</dd>
          <dt>{uk.item.type}</dt>
          <dd>{uk.types[item.type]}</dd>
        </dl>
      </div>
    </Window>
  );
}
