import { describe, expect, it } from 'vitest';
import { currentMonth, isMonth, monthOf, shiftMonth, todayOf, weeksOf } from './diary.utils';

describe('weeksOf', () => {
  it('starts the weeks on Monday, padding before the 1st', () => {
    // 1 March 2026 is a Sunday.
    const weeks = weeksOf('2026-03');

    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2026-03-01']);
    expect(weeks).toHaveLength(6);
    expect(weeks[5]).toEqual(['2026-03-30', '2026-03-31', null, null, null, null, null]);
  });

  it('needs no padding for a month that starts on Monday and fills four weeks', () => {
    // 1 February 2027 is a Monday, and the month has 28 days.
    const weeks = weeksOf('2027-02');

    expect(weeks).toHaveLength(4);
    expect(weeks[0]?.[0]).toBe('2027-02-01');
    expect(weeks[3]?.[6]).toBe('2027-02-28');
  });

  it('knows a leap February', () => {
    expect(
      weeksOf('2028-02')
        .flat()
        .filter((day) => day !== null),
    ).toHaveLength(29);
  });
});

describe('shiftMonth', () => {
  it('crosses the year both ways', () => {
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-03', 1)).toBe('2026-04');
  });
});

describe('monthOf', () => {
  it('is the date without its day', () => {
    expect(monthOf('2026-03-17')).toBe('2026-03');
  });
});

describe('currentMonth and todayOf', () => {
  it('read the local calendar, not UTC', () => {
    // Half past midnight local time on 1 December: west of UTC this is still November in
    // UTC terms, east of it the instant is already in December either way.
    const now = new Date(2026, 11, 1, 0, 30);

    expect(currentMonth(now)).toBe('2026-12');
    expect(todayOf(now)).toBe('2026-12-01');
  });
});

describe('isMonth', () => {
  it('believes only YYYY-MM with a real month', () => {
    expect(isMonth('2026-03')).toBe(true);
    expect(isMonth('March')).toBe(false);
    expect(isMonth('2026-13')).toBe(false);
    expect(isMonth('2026-3')).toBe(false);
  });
});
