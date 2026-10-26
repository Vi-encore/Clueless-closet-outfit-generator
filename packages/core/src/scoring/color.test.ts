import { describe, expect, it } from 'vitest';
import { hexToHsl, isBright, mainColor, scoreColor } from './color.js';
import { COLORS, bottom, top } from './test-fixtures.js';

describe('Requirement: Neutral colors go with everything', () => {
  it('Scenario: Neutral with a bright color', () => {
    const outfit = [top('t1', { colors: [COLORS.black] }), bottom('b1', { colors: [COLORS.red] })];

    expect(scoreColor(outfit)).toBeGreaterThanOrEqual(0);
  });

  it('Scenario: Two neutrals', () => {
    const outfit = [
      top('t1', { colors: [COLORS.white] }),
      bottom('b1', { type: 'jeans', colors: [COLORS.denim] }),
    ];

    expect(scoreColor(outfit)).toBeGreaterThan(0);
  });
});

describe('Requirement: At most one bright accent', () => {
  it('Scenario: Two bright colors', () => {
    const outfit = [
      top('t1', { colors: [COLORS.orange] }),
      bottom('b1', { colors: [COLORS.green] }),
    ];

    expect(scoreColor(outfit)).toBeLessThan(0);
  });
});

describe('Requirement: At most one print', () => {
  it('Scenario: Two prints', () => {
    const outfit = [
      top('t1', { colors: [COLORS.white], pattern: 'stripes' }),
      bottom('b1', { type: 'skirt', colors: [COLORS.black], pattern: 'floral' }),
    ];

    expect(scoreColor(outfit)).toBeLessThan(0);
  });
});

describe('Requirement: Missing data scores zero', () => {
  it('Scenario: Missing colors', () => {
    const outfit = [top('t1', { colors: [COLORS.white] }), bottom('b1')];

    expect(scoreColor(outfit)).toBe(0);
  });
});

describe('color helpers', () => {
  it('converts hex to HSL', () => {
    expect(hexToHsl('#ff0000')).toEqual({ h: 0, s: 1, l: 0.5 });
    expect(hexToHsl('#808080').s).toBe(0);
  });

  it('treats dark and pastel colors as not bright', () => {
    expect(isBright(COLORS.red)).toBe(true);
    expect(isBright(COLORS.navy)).toBe(false);
    expect(isBright(COLORS.pastelPink)).toBe(false);
  });

  it('picks the color with the largest share', () => {
    const colors = [
      { ...COLORS.white, share: 0.3 },
      { ...COLORS.navy, share: 0.7 },
    ];
    expect(mainColor(colors)?.family).toBe('navy');
  });
});
