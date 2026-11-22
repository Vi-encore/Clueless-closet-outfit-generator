import shirt from 'pixelarticons/svg/shirt.svg';
import { useState } from 'react';
import type { ItemThumbProps } from './stats.interfaces';

/**
 * An item's small picture, or the wardrobe's pixel shirt in its place: for an item with no
 * picture, and for one whose picture did not load, whose file may have been replaced since
 * the link was made. Decorative either way: the name beside it says what the item is.
 */
export function ItemThumb({ item }: ItemThumbProps) {
  const [failed, setFailed] = useState(false);
  const picture = item.cutoutUrl ?? item.photoUrl;

  return picture === null || failed ? (
    <img src={shirt} alt="" className="worn-picture worn-placeholder" />
  ) : (
    <img
      src={picture}
      alt=""
      className="worn-picture object-contain"
      onError={() => setFailed(true)}
    />
  );
}
