import { describe, expect, it } from 'vitest';
import { itemStatusSchema } from './item-tags.js';
import {
  ARCHIVE_REASONS,
  ITEM_STATUSES,
  ITEM_TYPES,
  SLOTS,
  TYPES_BY_SLOT,
  VISIBILITIES,
  typeBelongsToSlot,
} from './vocabularies.js';

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

describe("Requirement: An item's state is named by a vocabulary", () => {
  it('Scenario: Statuses are defined', () => {
    expect(ITEM_STATUSES).toEqual(['available', 'laundry', 'archived']);
  });

  it('Scenario: Visibilities are defined', () => {
    expect(VISIBILITIES).toEqual(['private', 'friends']);
  });

  it('Scenario: Archive reasons are defined', () => {
    expect(ARCHIVE_REASONS).toEqual(
      expect.arrayContaining(['worn_out', 'given_away', 'sold', 'damaged']),
    );
    // Without a way out, somebody with a reason we did not think of has to pick a lie.
    expect(ARCHIVE_REASONS).toContain('other');
  });

  it('Scenario: A value outside the vocabulary is rejected', () => {
    expect(itemStatusSchema.safeParse('archived').success).toBe(true);
    expect(itemStatusSchema.safeParse('lost').success).toBe(false);
  });
});
