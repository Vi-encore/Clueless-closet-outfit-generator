import { describe, expect, it } from 'vitest';
import { CASUAL, COLORS, WORK, bottom, onePiece, seeded, top } from '../scoring/test-fixtures.js';
import { generateOutfits } from './generate-outfits.js';
import type { GeneratedOutfit } from './generator.interfaces.js';

function first(outfits: readonly GeneratedOutfit[]): GeneratedOutfit {
  const [outfit] = outfits;
  if (outfit === undefined) throw new Error('No outfit was generated');
  return outfit;
}

describe('Requirement: An outfit has a base', () => {
  it('Scenario: A top and a bottom make an outfit', () => {
    const items = [top('t1'), bottom('b1')];

    const outfits = generateOutfits({ items, occasion: CASUAL, random: seeded(1) });

    expect(outfits).toHaveLength(1);
    expect([...first(outfits).itemIds].sort()).toEqual(['b1', 't1']);
  });

  it('Scenario: A one-piece is an outfit on its own', () => {
    const outfits = generateOutfits({
      items: [onePiece('d1')],
      occasion: CASUAL,
      random: seeded(1),
    });

    expect(outfits.map((outfit) => outfit.itemIds)).toEqual([['d1']]);
  });

  it('Scenario: No base, no outfit', () => {
    const items = [top('t1'), top('t2')];

    expect(generateOutfits({ items, occasion: CASUAL, random: seeded(1) })).toEqual([]);
  });
});

describe('Requirement: An outfit that breaks a hard filter is never offered', () => {
  it('Scenario: An item avoided for the occasion is left out', () => {
    const items = [top('party-top', { avoidOccasions: ['work'] }), top('t2'), bottom('b1')];

    for (let seed = 1; seed <= 20; seed++) {
      const outfit = first(generateOutfits({ items, occasion: WORK, random: seeded(seed) }));
      expect(outfit.itemIds).toContain('t2');
    }
  });
});

describe('Requirement: A good outfit is picked, not always the same one', () => {
  const wardrobe = [
    ...['t1', 't2', 't3', 't4'].map((id) => top(id, { colors: [COLORS.white], formality: 2 })),
    ...['b1', 'b2', 'b3'].map((id) => bottom(id, { colors: [COLORS.black], formality: 2 })),
  ];

  it('Scenario: The same randomness gives the same outfit', () => {
    const first = generateOutfits({ items: wardrobe, occasion: CASUAL, random: seeded(7) });
    const second = generateOutfits({ items: wardrobe, occasion: CASUAL, random: seeded(7) });

    expect(first).toEqual(second);
  });

  it('Scenario: A bad outfit is not picked over good ones', () => {
    // Ten bases of total 1.5 and a dress far below them (formality 5 for a casual target: -0.5).
    const good = [
      ...Array.from({ length: 10 }, (_, i) =>
        top(`t${i}`, { colors: [COLORS.white], formality: 2 }),
      ),
      bottom('b1', { colors: [COLORS.black], formality: 2 }),
    ];
    const items = [...good, onePiece('gown', { formality: 5 })];

    for (let seed = 1; seed <= 200; seed++) {
      const outfit = first(generateOutfits({ items, occasion: CASUAL, random: seeded(seed) }));
      expect(outfit.itemIds).not.toContain('gown');
    }
  });

  it('Scenario: Several outfits are distinct', () => {
    const outfits = generateOutfits({
      items: wardrobe,
      occasion: CASUAL,
      limit: 3,
      random: seeded(3),
    });

    expect(outfits).toHaveLength(3);
    const keys = outfits.map((outfit) => [...outfit.itemIds].sort().join());
    expect(new Set(keys).size).toBe(3);
  });

  it('returns as many outfits as exist when more are asked for', () => {
    const items = [top('t1'), bottom('b1'), bottom('b2')];

    expect(generateOutfits({ items, occasion: CASUAL, limit: 5, random: seeded(1) })).toHaveLength(
      2,
    );
  });

  it('picks different outfits with different randomness, ties included', () => {
    const picked = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      const outfit = first(
        generateOutfits({ items: wardrobe, occasion: CASUAL, random: seeded(seed) }),
      );
      picked.add([...outfit.itemIds].sort().join());
    }

    expect(picked.size).toBeGreaterThan(3);
  });
});
