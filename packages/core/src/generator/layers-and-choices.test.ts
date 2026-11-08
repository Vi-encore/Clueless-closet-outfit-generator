import { describe, expect, it } from 'vitest';
import { scoreOutfit } from '../scoring/score-outfit.js';
import type { Occasion } from '../scoring/schemas.js';
import {
  CASUAL,
  COLORS,
  bottom,
  onePiece,
  outerwear,
  seeded,
  shoes,
  top,
} from '../scoring/test-fixtures.js';
import { generateOutfits } from './generate-outfits.js';
import type { GenerateInput, GeneratedOutfit } from './generator.interfaces.js';

const FORMAL: Occasion = { code: 'party', targetFormality: 4 };

/** The first outfit for every seed from 1 to `runs`, so a rule is checked against many picks. */
function manyRuns(input: GenerateInput, runs = 30): GeneratedOutfit[] {
  return Array.from({ length: runs }, (_, i) => {
    const [outfit] = generateOutfits({ ...input, random: seeded(i + 1) });
    if (outfit === undefined) throw new Error('No outfit was generated');
    return outfit;
  });
}

describe('Requirement: Shoes and outerwear are added to the base', () => {
  it('Scenario: Shoes are added', () => {
    const items = [top('t1'), bottom('b1'), shoes('s1')];

    for (const outfit of manyRuns({ items, occasion: CASUAL })) {
      expect(outfit.itemIds).toEqual(['t1', 'b1', 's1']);
    }
  });

  it('Scenario: The better shoes are chosen', () => {
    const items = [
      top('t1', { formality: 4 }),
      bottom('b1', { formality: 4 }),
      shoes('casual-shoes', { formality: 2 }),
      shoes('heels', { type: 'heels', formality: 4 }),
    ];

    for (const outfit of manyRuns({ items, occasion: FORMAL })) {
      expect(outfit.itemIds).toContain('heels');
    }
  });

  it('Scenario: Outerwear that lowers the score is left off', () => {
    const items = [
      top('t1', { colors: [COLORS.red], pattern: 'stripes' }),
      bottom('b1', { colors: [COLORS.black] }),
      shoes('s1', { colors: [COLORS.black] }),
      outerwear('coat', { colors: [COLORS.green], pattern: 'floral' }),
    ];

    for (const outfit of manyRuns({ items, occasion: CASUAL })) {
      expect(outfit.itemIds).toEqual(['t1', 'b1', 's1']);
    }
  });

  it('adds outerwear that does not lower the score', () => {
    const neutral = { colors: [COLORS.black] };
    const items = [
      top('t1', neutral),
      bottom('b1', neutral),
      shoes('s1', neutral),
      outerwear('coat', neutral),
    ];

    for (const outfit of manyRuns({ items, occasion: CASUAL })) {
      expect(outfit.itemIds).toEqual(['coat', 't1', 'b1', 's1']);
    }
  });
});

describe('Requirement: An outfit that breaks a hard filter is never offered', () => {
  it('Scenario: Shoes too far in formality are left off', () => {
    const items = [
      top('t1', { formality: 5 }),
      bottom('b1', { formality: 5 }),
      shoes('s1', { formality: 1 }),
    ];

    for (const outfit of manyRuns({ items, occasion: FORMAL })) {
      expect(outfit.itemIds).toEqual(['t1', 'b1']);
    }
  });
});

describe('Requirement: An outfit is built around chosen items', () => {
  it('Scenario: Around a skirt', () => {
    const items = [top('t1'), bottom('trousers'), bottom('skirt', { type: 'skirt' })];

    for (const outfit of manyRuns({ items, occasion: CASUAL, mustInclude: ['skirt'] })) {
      expect(outfit.itemIds).toContain('skirt');
    }
  });

  it('Scenario: Around shoes', () => {
    const items = [top('t1'), bottom('b1'), shoes('s1'), shoes('s2')];

    for (const outfit of manyRuns({ items, occasion: CASUAL, mustInclude: ['s2'] })) {
      expect(outfit.itemIds).toContain('s2');
    }
  });

  it('Scenario: Two dresses cannot be one outfit', () => {
    const items = [onePiece('d1'), onePiece('d2')];

    expect(
      generateOutfits({ items, occasion: CASUAL, mustInclude: ['d1', 'd2'], random: seeded(1) }),
    ).toEqual([]);
  });

  it('keeps outerwear that was asked for even when it lowers the score', () => {
    const items = [
      top('t1', { colors: [COLORS.red], pattern: 'stripes' }),
      bottom('b1', { colors: [COLORS.black] }),
      outerwear('coat', { colors: [COLORS.green], pattern: 'floral' }),
    ];

    for (const outfit of manyRuns({ items, occasion: CASUAL, mustInclude: ['coat'] })) {
      expect(outfit.itemIds).toEqual(['coat', 't1', 'b1']);
    }
  });

  it('returns nothing when a chosen item is not among the items', () => {
    const items = [top('t1'), bottom('b1')];

    expect(
      generateOutfits({ items, occasion: CASUAL, mustInclude: ['gone'], random: seeded(1) }),
    ).toEqual([]);
  });
});

describe('Requirement: Items and outfits can be kept out', () => {
  it('Scenario: An excluded item is never used', () => {
    const items = [top('t1'), top('t2'), bottom('b1')];

    for (const outfit of manyRuns({ items, occasion: CASUAL, exclude: ['t1'] })) {
      expect(outfit.itemIds).toEqual(['t2', 'b1']);
    }
  });

  it('Scenario: Another one is another outfit', () => {
    const items = [top('t1'), bottom('b1'), bottom('b2')];

    for (const outfit of manyRuns({ items, occasion: CASUAL, seen: [['b1', 't1']] })) {
      expect(outfit.itemIds).toEqual(['t1', 'b2']);
    }
  });

  it('returns nothing when every outfit was seen', () => {
    const items = [top('t1'), bottom('b1')];

    expect(
      generateOutfits({ items, occasion: CASUAL, seen: [['t1', 'b1']], random: seeded(1) }),
    ).toEqual([]);
  });
});

describe('Requirement: An outfit says why it was chosen', () => {
  it("Scenario: The breakdown is the whole outfit's", () => {
    const t1 = top('t1', { colors: [COLORS.white], formality: 2 });
    const b1 = bottom('b1', { colors: [COLORS.denim], formality: 2 });
    const s1 = shoes('s1', { colors: [COLORS.red], formality: 3 });

    const [outfit] = generateOutfits({ items: [t1, b1, s1], occasion: CASUAL, random: seeded(1) });

    expect(outfit?.itemIds).toEqual(['t1', 'b1', 's1']);
    expect(outfit?.score).toEqual(scoreOutfit([t1, b1, s1], CASUAL));
  });
});
