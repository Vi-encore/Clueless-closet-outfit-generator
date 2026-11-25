import { describe, expect, it } from 'vitest';
import { anItem } from '../../../../test/api-fixtures';
import { backdropFor, contrast } from './doll.utils';

const wearing = (...hexes: string[]) =>
  hexes.map((hex, index) =>
    anItem({
      id: `item-${index}`,
      cutoutUrl: 'https://s.test/item.webp',
      colors: [
        { family: 'grey', hex: '#808080', share: 0.1 },
        { family: 'white', hex, share: 0.9 },
      ],
    }),
  );

describe('contrast', () => {
  it('is 21 for black on white and 1 for a colour on itself', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#7b2d8e', '#7b2d8e')).toBeCloseTo(1, 5);
  });
});

describe('backdropFor', () => {
  it('sets a white item on the dark backdrop', () => {
    expect(backdropFor(wearing('#fafafa'))).toBe('dark');
  });

  it('sets a black item on the light backdrop', () => {
    expect(backdropFor(wearing('#101010'))).toBe('light');
  });

  it('reads each item by its main colour, not its first', () => {
    // The grey at 10% would ask for nothing in particular; the white at 90% asks for dark.
    expect(backdropFor(wearing('#ffffff'))).toBe('dark');
  });

  it('finds the middle for white and black together', () => {
    expect(backdropFor(wearing('#ffffff', '#000000'))).toBe('middle');
  });

  it('is light when nothing has colours', () => {
    expect(backdropFor([anItem({ cutoutUrl: 'https://s.test/item.webp' })])).toBe('light');
    expect(backdropFor([])).toBe('light');
  });
});
