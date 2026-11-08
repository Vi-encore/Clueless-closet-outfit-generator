import { uk } from '../../../shared/i18n/uk';
import type { Item } from '../../wardrobe';
import { autoFit } from './auto-fit';
import type { DollProps, Placement } from './doll.interfaces';
import { MANNEQUIN } from './mannequin';

const nameOf = (item: Item) => item.name ?? uk.types[item.type];

/**
 * The outfit on a drawn mannequin, like Cher's screen: each cut-out placed by its slot.
 * An item without a cut-out would be its whole photograph, background and all, so it goes
 * beside the doll instead.
 */
export function Doll({ items }: DollProps) {
  const worn = items.flatMap((item) => {
    const placement = autoFit(item.slot, MANNEQUIN.anchors);
    return item.cutoutUrl !== null && placement !== null
      ? [{ item, src: item.cutoutUrl, placement }]
      : [];
  });
  const beside = items.filter((item) => !worn.some((on) => on.item.id === item.id));

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

/** Position and width only: with no height the browser keeps the image's proportions. */
function positioned({ left, top, width, layer }: Placement) {
  return { left: `${left}%`, top: `${top}%`, width: `${width}%`, zIndex: layer };
}
