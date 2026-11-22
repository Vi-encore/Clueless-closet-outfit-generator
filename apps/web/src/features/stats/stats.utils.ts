import { DEFAULT_UNWORN_DAYS, UNWORN_DAYS } from './stats.constants';
import type { Sector } from './stats.interfaces';

/** Counts as consecutive sectors of one turn, in the order given. */
export function sectorsOf(counts: readonly number[]): Sector[] {
  const total = counts.reduce((sum, count) => sum + count, 0);
  let from = 0;

  return counts.map((count) => {
    const to = total === 0 ? 0 : from + count / total;
    const sector = { from, to };
    from = to;
    return sector;
  });
}

/** The CSS that draws the sectors as a pie: each colour from where it starts to where it ends. */
export function pieGradient(sectors: readonly Sector[], colours: readonly string[]): string {
  const stops = sectors.map(
    ({ from, to }, index) => `${colours[index] ?? 'transparent'} ${from}turn ${to}turn`,
  );

  return `conic-gradient(${stops.join(', ')})`;
}

/** The address is typed by anybody, so a number of days is only believed if it is offered. */
export function daysFrom(text: string | null): (typeof UNWORN_DAYS)[number] {
  return UNWORN_DAYS.find((days) => days === text) ?? DEFAULT_UNWORN_DAYS;
}

/** A share as a whole percent; nothing of nothing is nothing. */
export function percentOf(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}
