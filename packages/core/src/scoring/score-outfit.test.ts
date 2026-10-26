import { describe, expect, it } from 'vitest';
import { checkHardFilters } from './filters.js';
import { scoreOutfit, weightedTotal } from './score-outfit.js';
import { CASUAL, COLORS, WORK, bottom, top } from './test-fixtures.js';
import type { Occasion } from './schemas.js';
import { COMPONENTS } from './types.js';

describe('Requirement: Weighted total with breakdown', () => {
  it('Scenario: Weighted total', () => {
    const occasion: Occasion = { code: 'party', targetFormality: 3, weights: { color: 2 } };

    expect(weightedTotal({ color: 0.5, formality: 1 }, occasion.weights)).toBe(2);
  });

  it('Scenario: Breakdown lists every component', () => {
    const outfit = [
      top('t1', { colors: [COLORS.white], formality: 3 }),
      bottom('b1', { colors: [COLORS.black], formality: 3 }),
    ];

    const { breakdown } = scoreOutfit(outfit, WORK);

    expect(Object.keys(breakdown).sort()).toEqual([...COMPONENTS].sort());
  });
});

describe('Requirement: Component score range', () => {
  it('Scenario: Component range', () => {
    const colorChoices = [
      undefined,
      [COLORS.black],
      [COLORS.red],
      [COLORS.orange],
      [COLORS.pastelPink],
    ];
    const formalityChoices = [undefined, 1, 3, 5];
    const patternChoices = [undefined, 'solid', 'stripes'] as const;

    const tops = colorChoices.flatMap((colors, i) =>
      formalityChoices.flatMap((formality, j) =>
        patternChoices.map((pattern, k) => top(`t${i}${j}${k}`, { colors, formality, pattern })),
      ),
    );
    const bottoms = tops.map(({ id, ...tags }) =>
      bottom(`b-${id}`, { ...tags, slot: 'bottom', type: 'trousers' }),
    );

    for (const occasion of [CASUAL, WORK]) {
      for (const t of tops) {
        for (const b of bottoms) {
          if (!checkHardFilters([t, b], occasion).ok) continue;
          for (const value of Object.values(scoreOutfit([t, b], occasion).breakdown)) {
            expect(value).toBeGreaterThanOrEqual(-1);
            expect(value).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });
});
