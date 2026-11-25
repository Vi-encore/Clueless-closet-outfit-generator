import { COLOR_FAMILIES, mainColor, type ColorFamily } from '@closet/core';
import { colorsColumnSchema } from './stats.constants.js';
import type { ColorCount, ColorRow, UnwornCursor } from './stats.interfaces.js';

/**
 * How many items are mostly of each colour family, most first; a tie keeps the order of
 * the vocabulary. An item with no colours, or with a column that does not read as colours,
 * is counted apart, last, under null.
 */
export function colorCounts(rows: readonly ColorRow[]): ColorCount[] {
  const counts = new Map<ColorFamily | null, number>();

  for (const { colors } of rows) {
    const parsed = colorsColumnSchema.safeParse(colors);
    const family = parsed.success ? (mainColor(parsed.data)?.family ?? null) : null;

    counts.set(family, (counts.get(family) ?? 0) + 1);
  }

  const rank = (family: ColorFamily | null) =>
    family === null ? COLOR_FAMILIES.length : COLOR_FAMILIES.indexOf(family);

  return [...counts]
    .map(([family, count]) => ({ family, count }))
    .sort((a, b) => {
      if ((a.family === null) !== (b.family === null)) {
        return a.family === null ? 1 : -1;
      }

      return b.count - a.count || rank(a.family) - rank(b.family);
    });
}

/**
 * A price as the database writes a `Decimal(10, 2)` (`3000`, `1199.9`), in whole cents.
 * Read from its digits, never through a float, so that no cent is lost on the way.
 */
export function centsOf(price: string): number {
  const [whole = '0', fraction = ''] = price.split('.');

  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
}

/** Cents written back as money: two decimals, always. */
export function moneyOf(cents: number): string {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

/** What each wear has cost, in cents, rounded half up once, here and nowhere else. */
export function perWear(price: string, wears: number): number {
  return Math.round(centsOf(price) / wears);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * The cursor of a page of unworn items: the moment and id of its last item, which the
 * next page starts after. Opaque to a client, which only ever hands it back.
 */
export function encodeCursor(since: Date, id: string): string {
  return Buffer.from(`${since.toISOString()}_${id}`).toString('base64url');
}

/** A cursor this API wrote, read back; null for anything else, which is then refused. */
export function decodeCursor(text: string): UnwornCursor | null {
  const decoded = Buffer.from(text, 'base64url').toString('utf8');
  const split = decoded.indexOf('_');

  if (split < 0) {
    return null;
  }

  const moment = decoded.slice(0, split);
  const id = decoded.slice(split + 1);
  const since = new Date(moment);

  // Written back exactly as `toISOString` wrote it, or it is not one of ours.
  if (Number.isNaN(since.getTime()) || since.toISOString() !== moment || !UUID.test(id)) {
    return null;
  }

  return { since, id };
}
