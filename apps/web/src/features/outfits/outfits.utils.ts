import { OCCASIONS, type OccasionCode } from '@closet/core';
import { DEFAULT_OCCASION } from './outfits.constants';
import type { Outfit } from './outfits.interfaces';

/** `YYYY-MM-DD` as `DD.MM.YYYY`, by its parts: through `Date` it would move a day west of UTC. */
export function calendarDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

/** The address is typed by anybody, so an occasion from it is only believed if it is one. */
export function occasionFrom(value: string | null): OccasionCode {
  return OCCASIONS.find((code) => code === value) ?? DEFAULT_OCCASION;
}

/** When it was saved, or made if it somehow was not. */
export function dayOf(outfit: Outfit): string {
  return new Date(outfit.savedAt ?? outfit.createdAt).toLocaleDateString('uk-UA');
}
