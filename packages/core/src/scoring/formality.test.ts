import { describe, expect, it } from 'vitest';
import { scoreFormality } from './formality.js';
import { bottom, top } from './test-fixtures.js';

describe('Requirement: Formality fit', () => {
  it('Scenario: Exact match', () => {
    const outfit = [top('t1', { formality: 3 }), bottom('b1', { formality: 3 })];

    expect(scoreFormality(outfit, 3)).toBe(1);
  });

  it('Scenario: Further is worse', () => {
    const averageFour = [top('t1', { formality: 4 }), bottom('b1', { formality: 4 })];
    const averageFive = [top('t2', { formality: 5 }), bottom('b2', { formality: 5 })];

    expect(scoreFormality(averageFive, 3)).toBeLessThan(scoreFormality(averageFour, 3));
  });
});

describe('Requirement: Missing data scores zero', () => {
  it('Scenario: Missing formality', () => {
    const outfit = [top('t1', { formality: 3 }), bottom('b1')];

    expect(scoreFormality(outfit, 3)).toBe(0);
  });
});
