import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router';
import { hasStatus } from '../../shared/api/api.utils';
import { uk } from '../../shared/i18n/uk';
import { NotFound } from '../../shared/ui/not-found';
import { Window } from '../../shared/ui/window';
import { OutfitPanel } from './outfit-panel';
import { outfitQuery } from './outfits.queries';

/** One outfit at its own address, with the same doll, reason and actions as when it was made. */
export function OutfitScreen() {
  const { id = '' } = useParams();
  const { data: outfit, error } = useQuery(outfitQuery(id));

  // Somebody else's outfit and no outfit at all are one answer from the API, by design.
  if (hasStatus(error, 404) || hasStatus(error, 400)) {
    return <NotFound />;
  }

  return (
    <Window
      title={outfit === undefined ? uk.outfits.title : uk.occasions[outfit.occasion]}
      parent="/outfits/saved"
      wide
    >
      {error !== null && <p role="alert">{uk.errors.unavailable}</p>}
      {outfit !== undefined && <OutfitPanel outfit={outfit} />}
    </Window>
  );
}
