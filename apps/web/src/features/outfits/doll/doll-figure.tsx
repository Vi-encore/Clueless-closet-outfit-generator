import { uk } from '../../../shared/i18n/uk';
import type { DollProps } from './doll.interfaces';
import { MANNEQUIN } from './mannequin';
import { BACKDROPS } from './doll.constants';
import { backdropFor, fittedOf, nameOf, positioned } from './doll.utils';

/**
 * The mannequin with every item that has a cut-out and a place on it, and nothing around
 * it. It fills its container's width, so the same figure is a full doll on the outfit
 * screen and a small one in a calendar cell. Images load lazily: a month has many dolls.
 */
export function DollFigure({ items }: DollProps) {
  const worn = fittedOf(items).sort((a, b) => a.placement.layer - b.placement.layer);
  // Chosen by what is on the doll only: an item beside it is shown on the window's grey.
  const backdrop = backdropFor(worn.map(({ item }) => item));

  return (
    <figure
      aria-label={uk.outfits.doll}
      className="doll relative m-0 w-full"
      data-backdrop={backdrop}
      style={{
        aspectRatio: `${MANNEQUIN.width} / ${MANNEQUIN.height}`,
        background: BACKDROPS[backdrop],
      }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${MANNEQUIN.width} ${MANNEQUIN.height}`}
        aria-hidden="true"
      >
        <circle {...MANNEQUIN.head} className="fill-[silver] stroke-[gray] stroke-[0.5]" />
        <path d={MANNEQUIN.body} className="fill-[silver] stroke-[gray] stroke-[0.5]" />
      </svg>
      {worn.map(({ item, src, placement }) => (
        <img
          key={item.id}
          src={src}
          alt={nameOf(item)}
          loading="lazy"
          className="absolute"
          style={positioned(placement)}
        />
      ))}
    </figure>
  );
}
