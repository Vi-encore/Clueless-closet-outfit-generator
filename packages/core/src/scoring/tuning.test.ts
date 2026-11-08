import { describe, expect, it } from 'vitest';
import { scoreColor } from './color.js';
import { checkHardFilters } from './filters.js';
import { scoreOutfit } from './score-outfit.js';
import { CASUAL, COLORS, WORK, bottom, top } from './test-fixtures.js';
import { DEFAULT_TUNING } from './tuning.js';
import type { Tuning } from './scoring.interfaces.js';

describe('Requirement: Scoring is tuned in one place', () => {
  it('Scenario: The defaults change nothing', () => {
    const outfit = [
      top('t1', { colors: [COLORS.red], formality: 2, pattern: 'stripes' }),
      bottom('b1', { colors: [COLORS.black], formality: 4 }),
    ];

    for (const occasion of [CASUAL, WORK]) {
      expect(scoreOutfit(outfit, occasion, DEFAULT_TUNING)).toEqual(scoreOutfit(outfit, occasion));
      expect(checkHardFilters(outfit, occasion, DEFAULT_TUNING)).toEqual(
        checkHardFilters(outfit, occasion),
      );
    }
  });

  it('Scenario: A tuning changes the score', () => {
    const outfit = [top('t1', { colors: [COLORS.red] }), bottom('b1', { colors: [COLORS.black] })];
    const tuning: Tuning = { ...DEFAULT_TUNING, color: { ...DEFAULT_TUNING.color, accent: 1 } };

    expect(scoreColor(outfit, tuning)).toBe(1);
  });

  it('Scenario: A tuning changes a filter', () => {
    const outfit = [top('t1', { formality: 1 }), bottom('b1', { formality: 4 })];
    const tuning: Tuning = { ...DEFAULT_TUNING, maxFormalityGap: 3 };

    expect(checkHardFilters(outfit, CASUAL)).toMatchObject({ ok: false });
    expect(checkHardFilters(outfit, CASUAL, tuning)).toEqual({ ok: true });
  });
});
