import { SLOTS, colorSchema } from '@closet/core';
import { z } from 'zod';

/** How many of the most worn items the statistics name. */
export const MOST_WORN = 5;

/** A colours column read back through its schema rather than cast: JSON is whatever wrote it. */
export const colorsColumnSchema = z.array(colorSchema);

/** The slot column read back as a slot of the vocabulary, for the same reason. */
export const slotColumnSchema = z.enum(SLOTS);
