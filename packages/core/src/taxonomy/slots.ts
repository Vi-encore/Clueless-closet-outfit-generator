import { TYPES_BY_SLOT, type ItemType, type Slot } from './vocabularies.js';

/** Whether a type is one of a slot's, as the vocabularies pair them. */
export function typeBelongsToSlot(type: ItemType, slot: Slot): boolean {
  // Widened on purpose: `includes` on a tuple of literals only accepts those literals.
  const typesOfSlot: readonly ItemType[] = TYPES_BY_SLOT[slot];
  return typesOfSlot.includes(type);
}
