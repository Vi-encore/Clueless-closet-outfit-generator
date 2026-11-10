import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { hasStatus } from '../../shared/api/api-error';
import { itemQuery } from './wardrobe.queries';
import { uk } from '../../shared/i18n/uk';
import { Window } from '../../shared/ui/window';
import { NotFound } from '../../shared/ui/not-found';
import { ItemSheet } from './item-sheet';

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

  return item === undefined ? null : <ItemSheet item={item} />;
}
