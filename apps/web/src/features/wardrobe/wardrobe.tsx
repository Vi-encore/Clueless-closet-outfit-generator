import { SLOTS } from '@closet/core';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useId, type ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { uk } from '../../shared/i18n/uk';
import { ItemTile } from './item-tile';
import { shownPages } from '../../shared/hooks/shown-pages';
import { Window } from '../../shared/ui/window';
import { wardrobeQuery } from './wardrobe.queries';
import { slotFrom, statusFrom } from './wardrobe.utils';

export function Wardrobe() {
  const [params, setParams] = useSearchParams();
  const slot = slotFrom(params.get('slot'));
  const status = statusFrom(params.get('status'));
  const { items, hasMore, failed, loading, more } = shownPages(
    useInfiniteQuery(wardrobeQuery({ slot, status })),
  );
  const filterId = useId();
  const showId = useId();

  // Each choice changes its own parameter and keeps the other, so the archive of shoes
  // stays the archive when the slot changes, and the other way round.
  const choose = (name: 'slot' | 'status') => (event: ChangeEvent<HTMLSelectElement>) => {
    setParams((current) => {
      const next = new URLSearchParams(current);

      if (event.target.value === '') {
        next.delete(name);
      } else {
        next.set(name, event.target.value);
      }

      return next;
    });
  };

  return (
    <Window title={uk.wardrobe.title} parent="/" wide>
      <Link to="/wardrobe/new" className="action mb-4 block md:inline-block">
        {uk.wardrobe.add}
      </Link>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
        <div className="field-row">
          <label htmlFor={showId}>{uk.wardrobe.show}</label>
          <select id={showId} value={status ?? ''} onChange={choose('status')}>
            <option value="">{uk.wardrobe.inWardrobe}</option>
            <option value="archived">{uk.wardrobe.archive}</option>
          </select>
        </div>
        <div className="field-row">
          <label htmlFor={filterId}>{uk.wardrobe.slot}</label>
          <select id={filterId} value={slot ?? ''} onChange={choose('slot')}>
            <option value="">{uk.wardrobe.everything}</option>
            {SLOTS.map((code) => (
              <option key={code} value={code}>
                {uk.slots[code]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {failed && <p role="alert">{uk.errors.unavailable}</p>}
      {!loading && !failed && items.length === 0 && (
        <p>{status === 'archived' ? uk.wardrobe.archiveEmpty : uk.wardrobe.empty}</p>
      )}

      {items.length > 0 && (
        <ul
          aria-label={uk.wardrobe.title}
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4"
        >
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={`/wardrobe/${item.id}`}
                className="item-tile block text-inherit no-underline"
              >
                <ItemTile item={item} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button type="button" className="mt-4" disabled={loading} onClick={more}>
          {uk.wardrobe.more}
        </button>
      )}
    </Window>
  );
}
