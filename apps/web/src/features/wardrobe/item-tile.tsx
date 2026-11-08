import type { ItemTileProps } from './wardrobe.interfaces';
import { uk } from '../../shared/i18n/uk';

/** An item in a list. Without a link: only the owner's wardrobe has a card to open. */
export function ItemTile({ item }: ItemTileProps) {
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
