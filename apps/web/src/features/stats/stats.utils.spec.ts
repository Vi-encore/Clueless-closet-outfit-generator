import { describe, expect, it } from 'vitest';
import { daysFrom, pieGradient, sectorsOf } from './stats.utils';

describe('sectorsOf', () => {
  it('turns counts into consecutive fractions of a turn', () => {
    expect(sectorsOf([3, 1])).toEqual([
      { from: 0, to: 0.75 },
      { from: 0.75, to: 1 },
    ]);
  });

  it('answers nothing for nothing', () => {
    expect(sectorsOf([])).toEqual([]);
    expect(sectorsOf([0, 0])).toEqual([
      { from: 0, to: 0 },
      { from: 0, to: 0 },
    ]);
  });
});

describe('pieGradient', () => {
  it('writes each sector in its colour, from where it starts to where it ends', () => {
    expect(
      pieGradient(
        [
          { from: 0, to: 0.75 },
          { from: 0.75, to: 1 },
        ],
        ['#f5f5f2', '#c81e23'],
      ),
    ).toBe('conic-gradient(#f5f5f2 0turn 0.75turn, #c81e23 0.75turn 1turn)');
  });
});

describe('daysFrom', () => {
  it('believes only the three choices, and takes 90 otherwise', () => {
    expect(daysFrom('30')).toBe('30');
    expect(daysFrom('180')).toBe('180');
    expect(daysFrom('45')).toBe('90');
    expect(daysFrom(null)).toBe('90');
  });
});
