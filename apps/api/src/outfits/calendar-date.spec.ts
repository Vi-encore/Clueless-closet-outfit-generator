import { describe, expect, it } from 'vitest';
import { calendarDateIn } from './calendar-date.js';

describe('Requirement: Wearing an outfit is recorded once a day', () => {
  it("Scenario: Today is the person's today", () => {
    const lateOnFirstOfMarch = new Date('2026-03-01T23:30:00Z');

    expect(calendarDateIn('Pacific/Auckland', lateOnFirstOfMarch)).toBe('2026-03-02');
    expect(calendarDateIn('Europe/Kyiv', lateOnFirstOfMarch)).toBe('2026-03-02');
    expect(calendarDateIn('America/Los_Angeles', lateOnFirstOfMarch)).toBe('2026-03-01');
  });
});
