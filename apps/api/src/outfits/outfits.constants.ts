import { z } from 'zod';
import { COMPONENTS, OCCASIONS } from '@closet/core';

/** Checked for shape before Prisma, which would fail on a non-uuid with a 500. */
export const outfitIdSchema = z.uuid();

/** What every read of an outfit brings along: its items' rows, to answer them with. */
export const WITH_ITEMS = { items: { include: { item: true } } } as const;

/** Read back through schemas rather than cast: a column is only as typed as what wrote it. */
export const occasionCodeSchema = z.enum(OCCASIONS);

export const breakdownSchema = z.record(z.enum(COMPONENTS), z.number());
