import { SLOTS, colorSchema } from '@closet/core';
import { z } from 'zod';

/** How many of the most worn items the statistics name. */
export const MOST_WORN = 5;

/** A colours column read back through its schema rather than cast: JSON is whatever wrote it. */
export const colorsColumnSchema = z.array(colorSchema);

/** The slot column read back as a slot of the vocabulary, for the same reason. */
export const slotColumnSchema = z.enum(SLOTS);

/**
 * What the statistics ask for the time. "Not worn for 90 days" depends on today, and a
 * test cannot wait for one; the diary has a clock of its own for the same reason.
 */
export const CLOCK = Symbol('STATS_CLOCK');

/** How long unworn can be asked about, in days; anything else is refused. */
export const UNWORN_DAYS = ['30', '90', '180'] as const;

export const DEFAULT_UNWORN_DAYS = '90';

export const DAY_MS = 24 * 60 * 60 * 1000;
