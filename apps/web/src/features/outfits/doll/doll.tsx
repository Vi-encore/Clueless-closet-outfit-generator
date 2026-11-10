import { useId, useState } from 'react';
import { uk } from '../../../shared/i18n/uk';
import { autoFit } from './auto-fit';
import type { DollProps } from './doll.interfaces';
import { MANNEQUIN } from './mannequin';
import { nameOf, positioned } from './doll.utils';

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
  const fitted = items.flatMap((item) => {
    const placement = autoFit(item.slot, MANNEQUIN.anchors);
    return item.cutoutUrl !== null && placement !== null
      ? [{ item, src: item.cutoutUrl, placement }]
      : [];
  });
  const hasOuterwear = fitted.some(({ item }) => item.slot === 'outerwear');
  const worn = fitted.filter(({ item }) => showOuterwear || item.slot !== 'outerwear');
  const beside = items.filter((item) => !fitted.some((on) => on.item.id === item.id));

  return (
    <div className="flex flex-col items-center gap-2">
      <figure
        aria-label={uk.outfits.doll}
        className="doll relative m-0 w-full max-w-60"
        style={{ aspectRatio: `${MANNEQUIN.width} / ${MANNEQUIN.height}` }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox={`0 0 ${MANNEQUIN.width} ${MANNEQUIN.height}`}
          aria-hidden="true"
        >
          <circle {...MANNEQUIN.head} className="fill-[silver] stroke-[gray] stroke-[0.5]" />
          <path d={MANNEQUIN.body} className="fill-[silver] stroke-[gray] stroke-[0.5]" />
        </svg>
        {worn
          .sort((a, b) => a.placement.layer - b.placement.layer)
          .map(({ item, src, placement }) => (
            <img
              key={item.id}
              src={src}
              alt={nameOf(item)}
              className="absolute"
              style={positioned(placement)}
            />
          ))}
      </figure>
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
