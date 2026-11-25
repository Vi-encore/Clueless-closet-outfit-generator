import { describe, expect, it } from 'vitest';
import {
  centsOf,
  colorCounts,
  decodeCursor,
  encodeCursor,
  moneyOf,
  perWear,
} from './stats.utils.js';

const mostly = (family: string, hex = '#808080') => [
  { family, hex, share: 0.8 },
  { family: 'grey', hex: '#808080', share: 0.2 },
];

describe('colorCounts', () => {
  it('counts each item once, by the family covering most of it', () => {
    const counts = colorCounts([
      { colors: mostly('white') },
      { colors: mostly('white') },
      { colors: mostly('red') },
    ]);

    expect(counts).toEqual([
      { family: 'white', count: 2 },
      { family: 'red', count: 1 },
    ]);
  });

  it('counts items with no colours, or colours it cannot read, apart and last', () => {
    const counts = colorCounts([
      { colors: null },
      { colors: [] },
      { colors: 'not colours' },
      { colors: mostly('navy') },
    ]);

    expect(counts).toEqual([
      { family: 'navy', count: 1 },
      { family: null, count: 3 },
    ]);
  });

  it('breaks a tie by the order of the vocabulary', () => {
    const counts = colorCounts([{ colors: mostly('red') }, { colors: mostly('black') }]);

    expect(counts.map(({ family }) => family)).toEqual(['black', 'red']);
  });
});

describe('money in cents', () => {
  it('reads a price as the database writes it', () => {
    expect(centsOf('3000')).toBe(300_000);
    expect(centsOf('1199.9')).toBe(119_990);
    expect(centsOf('0.05')).toBe(5);
  });

  it('writes cents back with two decimals', () => {
    expect(moneyOf(42_857)).toBe('428.57');
    expect(moneyOf(5)).toBe('0.05');
    expect(moneyOf(75_000)).toBe('750.00');
  });

  it('divides a price by its wears to the cent, half up', () => {
    expect(perWear('3000', 7)).toBe(42_857);
    expect(perWear('0.05', 2)).toBe(3);
    expect(perWear('1200', 6)).toBe(20_000);
  });
});

describe('the unworn cursor', () => {
  const ID = '5ec22a94-2e82-4241-a4b3-0f08b405064d';

  it('reads back what it wrote', () => {
    const since = new Date('2026-03-01T09:30:00.123Z');

    expect(decodeCursor(encodeCursor(since, ID))).toEqual({ since, id: ID });
  });

  it('is opaque: no date or id can be read from it by eye', () => {
    expect(encodeCursor(new Date('2026-03-01T00:00:00Z'), ID)).not.toContain('2026');
  });

  it('refuses anything it did not write', () => {
    expect(decodeCursor('not-a-cursor')).toBeNull();
    expect(decodeCursor(Buffer.from('yesterday_' + ID).toString('base64url'))).toBeNull();
    expect(
      decodeCursor(Buffer.from('2026-03-01T00:00:00.000Z_me').toString('base64url')),
    ).toBeNull();
  });
});
