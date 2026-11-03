import { useCallback } from 'react';
import { useLocation, useParams } from 'react-router';
import { hasStatus } from '../shared/api/api-error';
import { listFriendItems } from '../api/items';
import { uk } from '../shared/i18n/uk';
import { ItemTile } from '../shell/item-tile';
import { usePages } from '../shared/hooks/use-pages';
import { Window } from '../shared/ui/window';
import { NotFound } from '../shared/ui/not-found';

/** What a friend marked for friends: to look at, and nothing more. */
export function FriendWardrobe() {
  const { username = '' } = useParams();
  const { state } = useLocation();
  const load = useCallback((cursor?: string) => listFriendItems({ username, cursor }), [username]);
  const { items, nextCursor, failed, error, loading, more } = usePages(load);
  // The name the list already knew, or the address's where there is no list behind this.
  const title = uk.friends.wardrobeOf((state as { name?: string } | null)?.name ?? username);

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
