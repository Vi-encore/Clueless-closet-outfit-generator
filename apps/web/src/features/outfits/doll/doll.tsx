import { useId, useState } from 'react';
import { uk } from '../../../shared/i18n/uk';
import { DollFigure } from './doll-figure';
import type { DollProps } from './doll.interfaces';
import { fittedOf, nameOf } from './doll.utils';

/**
 * The outfit on a drawn mannequin, like Cher's screen: each cut-out placed by its slot.
 * An item without a cut-out would be its whole photograph, background and all, so it goes
 * beside the doll instead.
 */
export function Doll({ items }: DollProps) {
  const toggleId = useId();
  // A cut-out is flat and opaque, so a closed coat hides the whole top under it. Taking it
  // off the doll changes only the picture: the outfit is still the outfit.
  const [showOuterwear, setShowOuterwear] = useState(true);
  const fitted = fittedOf(items);
  const hasOuterwear = fitted.some(({ item }) => item.slot === 'outerwear');
  const shown = items.filter((item) => showOuterwear || item.slot !== 'outerwear');
  const beside = items.filter((item) => !fitted.some((on) => on.item.id === item.id));

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-full max-w-60">
        <DollFigure items={shown} />
      </div>
      {hasOuterwear && (
        <div className="field-row">
          <input
            id={toggleId}
            type="checkbox"
            checked={showOuterwear}
            onChange={(event) => setShowOuterwear(event.target.checked)}
          />
          <label htmlFor={toggleId}>{uk.outfits.showOuterwear}</label>
        </div>
      )}
      {beside.length > 0 && (
        <ul aria-label={uk.outfits.notOnDoll} className="m-0 flex list-none flex-wrap gap-2 p-0">
          {beside.map((item) => (
            <li key={item.id}>
              {item.photoUrl === null ? (
                nameOf(item)
              ) : (
                <img src={item.photoUrl} alt={nameOf(item)} className="h-16 w-16 object-cover" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
