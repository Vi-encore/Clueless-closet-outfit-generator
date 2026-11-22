import { COLOR_SWATCHES, LEAST_COLOR_SHARE, type ItemColor } from '@closet/core';
import { describe, expect, it } from 'vitest';
import { withAdded, withFamily, withoutColor } from './wardrobe.utils';

const GREY: ItemColor = { family: 'grey', hex: '#bdbdbd', share: 0.8 };
const RED: ItemColor = { family: 'red', hex: '#c81e23', share: 0.15 };
const WHITE: ItemColor = { family: 'white', hex: '#f0f0f0', share: 0.5 };

describe('withFamily', () => {
  it('changes the family to its typical colour and keeps the share', () => {
    expect(withFamily([GREY, RED], 0, 'white')).toEqual([
      { family: 'white', hex: COLOR_SWATCHES.white, share: 0.8 },
      RED,
    ]);
  });

  it('merges into a family already listed, capping the share at the whole item', () => {
    expect(withFamily([GREY, WHITE], 0, 'white')).toEqual([
      { family: 'white', hex: COLOR_SWATCHES.white, share: 1 },
    ]);
    expect(withFamily([RED, WHITE], 0, 'white')).toEqual([
      { family: 'white', hex: COLOR_SWATCHES.white, share: 0.65 },
    ]);
  });

  it('leaves the list as it was for the family it already is', () => {
    const colors = [GREY, RED];

    expect(withFamily(colors, 0, 'grey')).toEqual(colors);
  });
});

describe('withAdded', () => {
  it('adds a family with the smallest share the photograph would report', () => {
    expect(withAdded([GREY], 'navy')).toEqual([
      GREY,
      { family: 'navy', hex: COLOR_SWATCHES.navy, share: LEAST_COLOR_SHARE },
    ]);
  });

  it('makes the first colour the whole item', () => {
    expect(withAdded([], 'white')).toEqual([
      { family: 'white', hex: COLOR_SWATCHES.white, share: 1 },
    ]);
  });

  it('does not add a family twice', () => {
    expect(withAdded([GREY], 'grey')).toEqual([GREY]);
  });
});

describe('withoutColor', () => {
  it('removes the one at that place', () => {
    expect(withoutColor([GREY, RED, WHITE], 1)).toEqual([GREY, WHITE]);
  });
});
