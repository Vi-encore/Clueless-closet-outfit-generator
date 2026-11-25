import { z } from 'zod';
import { WITH_ITEMS } from '../outfits/outfits.constants.js';

/**
 * What the diary asks for the time. "Today" decides which days are memories, and a test
 * cannot wait a year for one, so the clock is a provider it can replace.
 */
export const CLOCK = Symbol('CLOCK');

/** Checked for shape before Prisma, which would fail on a non-uuid with a 500. */
export const diaryEntryIdSchema = z.uuid();

/** What every read of a day brings along: its outfit and the outfit's items. */
export const WITH_OUTFIT = { outfit: { include: WITH_ITEMS } } as const;

/** Oldest first within a day too, so two outfits worn on one day keep their order. */
export const DIARY_ORDER = [{ date: 'asc' }, { createdAt: 'asc' }] as const;

/** The kinds of memory, in the order they are answered. */
export const MEMORY_KINDS = ['year', 'month'] as const;
