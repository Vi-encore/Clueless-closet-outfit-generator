import { useQuery } from '@tanstack/react-query';
import { OutfitPanel } from './outfit-panel';
import type { ShownOutfitProps } from './outfits.interfaces';
import { outfitQuery } from './outfits.queries';

/** Read from the cache, where generating put it and where liking and saving update it. */
export function ShownOutfit({ id }: ShownOutfitProps) {
  const { data: outfit } = useQuery(outfitQuery(id));

  return outfit === undefined ? null : <OutfitPanel outfit={outfit} />;
}
