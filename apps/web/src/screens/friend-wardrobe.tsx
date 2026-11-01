import { useCallback } from 'react';
import { useParams } from 'react-router';
import { hasStatus } from '../api/api-error';
import { listFriendItems } from '../api/items';
import { uk } from '../i18n/uk';
import { ItemTile } from '../shell/item-tile';
import { usePages } from '../shell/use-pages';
import { Window } from '../shell/window';
import { NotFound } from './not-found';

/** What a friend marked for friends: to look at, and nothing more. */
export function FriendWardrobe() {
  const { username = '' } = useParams();
  const load = useCallback(
    (cursor?: string) => listFriendItems({ username, cursor }),
    [username],
  );
  const { items, nextCursor, failed, error, loading, more } = usePages(load);
  const title = uk.friends.wardrobeOf(username);

  // A stranger, somebody who blocked you and a name nobody has are one answer from the
  // API, by design, and this keeps them one answer on screen.
  if (hasStatus(error, 404)) {
    return <NotFound />;
  }

  return (
    <Window title={title} parent="/friends" wide>
      {failed && <p role="alert">{uk.errors.unavailable}</p>}
      {!loading && !failed && items.length === 0 && <p>{uk.friends.nothingShared}</p>}

      {items.length > 0 && (
        <ul aria-label={title} className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <li key={item.id}>
              <ItemTile item={item} />
            </li>
          ))}
        </ul>
      )}

      {nextCursor !== null && (
        <button type="button" className="mt-4" disabled={loading} onClick={more}>
          {uk.wardrobe.more}
        </button>
      )}
    </Window>
  );
}
