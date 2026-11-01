import { SLOTS, type Slot } from '@closet/core';
import { useCallback, useId, type ChangeEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { Item } from '../api/api.interfaces';
import { listItems } from '../api/items';
import { uk } from '../i18n/uk';
import { usePages } from '../shell/use-pages';
import { Window } from '../shell/window';

/** The address is typed by anybody, so a slot from it is only believed if it is one. */
function slotFrom(value: string | null): Slot | undefined {
  return SLOTS.find((slot) => slot === value);
}

export function Wardrobe() {
  const [params, setParams] = useSearchParams();
  const slot = slotFrom(params.get('slot'));
  const load = useCallback((cursor?: string) => listItems({ slot, cursor }), [slot]);
  const { items, nextCursor, failed, loading, more } = usePages(load);
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

      {nextCursor !== null && (
        <button type="button" className="mt-4" disabled={loading} onClick={more}>
          {uk.wardrobe.more}
        </button>
      )}
    </Window>
  );
}

function ItemTile({ item }: { item: Item }) {
  const name = item.name ?? uk.types[item.type];

  return (
    <figure className="flex flex-col gap-1">
      {item.photoUrl === null ? (
        <div className="item-photo" />
      ) : (
        // `lazy`, because a page of these is a page of full photographs, and on a phone
        // most of it is below the fold.
        <img className="item-photo" src={item.photoUrl} alt={name} loading="lazy" />
      )}
      <figcaption>{name}</figcaption>
    </figure>
  );
}
