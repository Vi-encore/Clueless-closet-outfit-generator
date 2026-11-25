import { describe, expect, it } from 'vitest';
import { pluralUk } from './i18n.utils';

// The forms are named by role rather than written in Ukrainian: every Ukrainian word lives
// in uk.ts, tests included, and the rule is about which form is picked, not its spelling.
const form = (count: number) => pluralUk(count, 'one', 'few', 'many');

describe('pluralUk', () => {
  it('takes the form Ukrainian takes for the number', () => {
    expect([1, 2, 4, 5, 0].map(form)).toEqual(['one', 'few', 'few', 'many', 'many']);
  });

  it('counts by the last digits, eleven to fourteen apart', () => {
    expect([11, 12, 14, 21, 22, 25, 111, 112].map(form)).toEqual([
      'many',
      'many',
      'many',
      'one',
      'few',
      'many',
      'many',
      'many',
    ]);
  });
});
