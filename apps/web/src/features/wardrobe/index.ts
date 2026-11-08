/**
 * What the rest of the client may use of the wardrobe. A friend's wardrobe draws the same
 * tiles and reads items through the same module, so those two are shared from here.
 */
export { ItemCard } from './item-card';
export { ItemTile } from './item-tile';
export { NewItem } from './new-item';
export { Wardrobe } from './wardrobe';
export { listFriendItems } from './wardrobe.api';
export type { Item } from './wardrobe.interfaces';
