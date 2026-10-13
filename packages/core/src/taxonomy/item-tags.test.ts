import { describe, expect, it } from 'vitest';
import { itemTagsSchema } from './item-tags.js';

const blouse = { slot: 'top', type: 'blouse' } as const;

/** Top-level fields that failed validation; empty when the input is valid. */
function failedFields(input: unknown): string[] {
  const result = itemTagsSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => String(issue.path[0]));
}

describe('Requirement: Tags use vocabulary codes', () => {
  it('Scenario: Known code accepted', () => {
    expect(failedFields({ ...blouse, pattern: 'stripes' })).toEqual([]);
  });

  it('Scenario: Unknown code rejected', () => {
    expect(failedFields({ ...blouse, styles: ['casul'] })).toEqual(['styles']);
  });

  it('Scenario: Label instead of code rejected', () => {
    expect(failedFields({ slot: 'top', type: 'Блуза' })).toEqual(['type']);
  });
});

describe('Requirement: Slot and type are the only required tags', () => {
  it('Scenario: Minimal item', () => {
    expect(failedFields(blouse)).toEqual([]);
  });

  it('Scenario: Missing type', () => {
    expect(failedFields({ slot: 'top' })).toEqual(['type']);
  });
});

describe('Requirement: Type belongs to its slot', () => {
  it('Scenario: Type from another slot', () => {
    expect(failedFields({ slot: 'bottom', type: 'blouse' })).toEqual(['type']);
  });
});

describe('Requirement: Warmth and formality scales', () => {
  it('Scenario: Out of range', () => {
    expect(failedFields({ ...blouse, formality: 6 })).toEqual(['formality']);
  });

  it('Scenario: Not a whole number', () => {
    expect(failedFields({ ...blouse, warmth: 2.5 })).toEqual(['warmth']);
  });
});

describe('Requirement: Seasons are distinct', () => {
  it('Scenario: All four seasons', () => {
    expect(failedFields({ ...blouse, seasons: ['spring', 'summer', 'autumn', 'winter'] })).toEqual([]);
  });

  it('Scenario: Duplicate season', () => {
    expect(failedFields({ ...blouse, seasons: ['summer', 'summer'] })).toEqual(['seasons']);
  });
});

describe('Requirement: Material composition', () => {
  it('Scenario: Percentages omitted', () => {
    expect(failedFields({ ...blouse, materials: [{ material: 'silk' }] })).toEqual([]);
  });

  it('Scenario: Percentages over 100', () => {
    const materials = [
      { material: 'viscose', percent: 70 },
      { material: 'polyester', percent: 40 },
    ];
    expect(failedFields({ ...blouse, materials })).toEqual(['materials']);
  });

  it('Scenario: Duplicate material', () => {
    const materials = [{ material: 'cotton' }, { material: 'cotton' }];
    expect(failedFields({ ...blouse, materials })).toEqual(['materials']);
  });
});
