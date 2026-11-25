import { describe, expect, it } from 'vitest';
import { memoryDates, monthRange } from './diary.utils.js';

describe('monthRange', () => {
  it('spans the month, the next month first day excluded', () => {
    expect(monthRange('2026-03')).toEqual({ from: '2026-03-01', to: '2026-04-01' });
  });

  it('runs into the next year from December', () => {
    expect(monthRange('2026-12')).toEqual({ from: '2026-12-01', to: '2027-01-01' });
  });
});

describe('memoryDates', () => {
  it('a year and a month before an ordinary day', () => {
    expect(memoryDates('2026-11-22')).toEqual({ year: '2025-11-22', month: '2026-10-22' });
  });

  it('a month before January is last December', () => {
    expect(memoryDates('2027-01-15')).toEqual({ year: '2026-01-15', month: '2026-12-15' });
  });

  it('no month memory for a day the month before never had', () => {
    expect(memoryDates('2027-03-31')).toEqual({ year: '2026-03-31', month: null });
  });

  it('no year memory for 29 February after an ordinary year', () => {
    expect(memoryDates('2028-02-29')).toEqual({ year: null, month: '2028-01-29' });
  });
});
