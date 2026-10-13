import { describe, expect, it } from 'vitest';
import { checkHardFilters } from './filters.js';
import { CASUAL, WORK, bottom, top } from './test-fixtures.js';

describe('Requirement: Formality gap filter', () => {
  it('Scenario: Gap of three rejected', () => {
    const result = checkHardFilters(
      [top('t1', { formality: 1 }), bottom('b1', { formality: 4 })],
      CASUAL,
    );

    expect(result).toEqual({ ok: false, reasons: [{ kind: 'formality_gap', gap: 3 }] });
  });

  it('Scenario: Gap of two accepted', () => {
    const result = checkHardFilters(
      [top('t1', { formality: 2 }), bottom('b1', { formality: 4 })],
      CASUAL,
    );

    expect(result).toEqual({ ok: true });
  });
});

describe('Requirement: Avoided occasion filter', () => {
  it('Scenario: Avoided occasion rejected', () => {
    const partyTop = top('party-top', { avoidOccasions: ['work'] });

    const result = checkHardFilters([partyTop, bottom('b1')], WORK);

    expect(result).toEqual({
      ok: false,
      reasons: [{ kind: 'avoided_occasion', itemId: 'party-top', occasion: 'work' }],
    });
  });
});
