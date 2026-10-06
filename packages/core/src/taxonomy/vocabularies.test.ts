import { describe, expect, it } from 'vitest';
import { ITEM_TYPES, SLOTS, TYPES_BY_SLOT, typeBelongsToSlot } from './vocabularies';

describe('Tag vocabularies', () => {
  it('every slot has at least one type', () => {
    for (const slot of SLOTS) {
      expect(TYPES_BY_SLOT[slot].length).toBeGreaterThan(0);
    }
  });

  it('no type belongs to two slots', () => {
    expect(new Set(ITEM_TYPES).size).toBe(ITEM_TYPES.length);
  });

  it('knows which slot a type belongs to', () => {
    expect(typeBelongsToSlot('blouse', 'top')).toBe(true);
    expect(typeBelongsToSlot('blouse', 'bottom')).toBe(false);
  });
});
