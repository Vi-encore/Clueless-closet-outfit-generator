import { SLOTS, type Slot } from '@closet/core';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useId, type ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { uk } from '../../shared/i18n/uk';
import { ItemTile } from './item-tile';
import { shownPages } from '../../shared/hooks/shown-pages';
import { Window } from '../../shared/ui/window';
import { wardrobeQuery } from './wardrobe.queries';

/** The address is typed by anybody, so a slot from it is only believed if it is one. */
function slotFrom(value: string | null): Slot | undefined {
  return SLOTS.find((slot) => slot === value);
}

export function Wardrobe() {
  const [params, setParams] = useSearchParams();
  const slot = slotFrom(params.get('slot'));
  const { items, hasMore, failed, loading, more } = shownPages(
    useInfiniteQuery(wardrobeQuery(slot)),
  );
  const filterId = useId();

  const chooseSlot = (event: ChangeEvent<HTMLSelectElement>) => {
    setParams(event.target.value === '' ? {} : { slot: event.target.value });
  };

  return (
    <Window title={uk.wardrobe.title} parent="/" wide>
      <Link to="/wardrobe/new" className="action mb-4 block md:inline-block">
        {uk.wardrobe.add}
      </Link>
      <div className="field-row mb-4">
        <label htmlFor={filterId}>{uk.wardrobe.slot}</label>
        <select id={filterId} value={slot ?? ''} onChange={chooseSlot}>
          <option value="">{uk.wardrobe.everything}</option>
          {SLOTS.map((code) => (
            <option key={code} value={code}>
              {uk.slots[code]}
            </option>
          ))}
        </select>
      </div>

      {failed && <p role="alert">{uk.errors.unavailable}</p>}
      {!loading && !failed && items.length === 0 && <p>{uk.wardrobe.empty}</p>}

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
