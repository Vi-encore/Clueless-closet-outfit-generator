import { SLOTS } from '@closet/core';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import type { Page } from '../pagination.interfaces.js';
import { ItemsService } from '../items/items.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CLOCK, DAY_MS, MOST_WORN, slotColumnSchema } from './stats.constants.js';
import type { UnwornQuery } from './requests/unworn.query.js';
import type {
  Clock,
  CostPerWear,
  PricedItem,
  SlotCount,
  StatsView,
  UnwornItem,
  UnwornRow,
} from './stats.interfaces.js';
import {
  centsOf,
  colorCounts,
  decodeCursor,
  encodeCursor,
  moneyOf,
  perWear,
} from './stats.utils.js';

/**
 * The wardrobe in numbers. Archived items are left out of everything: they have left the
 * wardrobe, and counting them would make it look larger and less worn than it is. Every
 * query names the owner, so nobody reads another person's numbers.
 */
@Injectable()
export class StatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly items: ItemsService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async summary(ownerId: string): Promise<StatsView> {
    const inWardrobe = { ownerId, status: { not: 'archived' } };
    const worn = { ...inWardrobe, wearCount: { gt: 0 } };

    const [slots, wornCount, colorRows, mostWorn, priced] = await Promise.all([
      this.prisma.item.groupBy({ by: ['slot'], where: inWardrobe, _count: { _all: true } }),
      this.prisma.item.count({ where: worn }),
      this.prisma.item.findMany({ where: inWardrobe, select: { colors: true } }),
      this.prisma.item.findMany({
        where: worn,
        orderBy: [{ wearCount: 'desc' }, { createdAt: 'asc' }],
        take: MOST_WORN,
      }),
      this.prisma.item.findMany({ where: { ...inWardrobe, price: { not: null } } }),
    ]);

    // In the vocabulary's order, so the slots read the same way everywhere.
    const bySlot: SlotCount[] = slots
      .map(({ slot, _count }) => ({ slot: slotColumnSchema.parse(slot), count: _count._all }))
      .sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));

    const paidFor = priced
      .filter((row) => row.wearCount > 0)
      .map((row) => ({ row, cents: perWear(String(row.price), row.wearCount) }))
      .sort((a, b) => a.cents - b.cents);
    const waiting = priced
      .filter((row) => row.wearCount === 0)
      .map((row) => ({ row, cents: centsOf(String(row.price)) }))
      .sort((a, b) => b.cents - a.cents);

    const [mostWornViews, paidForViews, waitingViews] = await Promise.all([
      this.items.views(mostWorn),
      this.items.views(paidFor.map(({ row }) => row)),
      this.items.views(waiting.map(({ row }) => row)),
    ]);

    const costPerWear: CostPerWear[] = paidFor.map(({ row, cents }, index) => ({
      item: paidForViews[index] ?? this.missing(row.id),
      perWear: moneyOf(cents),
      currency: row.currency,
    }));
    const unwornWithPrice: PricedItem[] = waiting.map(({ row, cents }, index) => ({
      item: waitingViews[index] ?? this.missing(row.id),
      price: moneyOf(cents),
      currency: row.currency,
    }));

    return {
      items: bySlot.reduce((sum, { count }) => sum + count, 0),
      worn: wornCount,
      bySlot,
      byColor: colorCounts(colorRows),
      mostWorn: mostWornViews,
      costPerWear,
      unwornWithPrice,
    };
  }

  /**
   * The items not worn for `days`, the longest unworn first, a page at a time. An item never
   * worn has been unworn since it was added.
   *
   * Raw, because Prisma can neither order nor page by `coalesce(lastWornAt, createdAt)`.
   * The page is keyset: it starts after the row the cursor names, by that moment and then
   * the id, so an item archived meanwhile never shifts the next page onto one already seen.
   * `Prisma.sql` makes every value a parameter; nothing is pasted into the text.
   */
  async unworn(ownerId: string, query: UnwornQuery): Promise<Page<UnwornItem>> {
    const cutoff = new Date(this.clock().getTime() - query.days * DAY_MS);
    const after = query.cursor === undefined ? null : decodeCursor(query.cursor);
    const afterCursor =
      after === null
        ? Prisma.empty
        : Prisma.sql`AND (coalesce("lastWornAt", "createdAt"), id) > (${after.since}, ${after.id}::uuid)`;

    const rows = await this.prisma.$queryRaw<UnwornRow[]>`
      SELECT id, coalesce("lastWornAt", "createdAt") AS since
      FROM "Item"
      WHERE "ownerId" = ${ownerId}::uuid
        AND status <> 'archived'
        AND coalesce("lastWornAt", "createdAt") < ${cutoff}
        ${afterCursor}
      ORDER BY since, id
      LIMIT ${query.limit + 1}
    `;

    const page = rows.slice(0, query.limit);
    const stored = await this.prisma.item.findMany({
      where: { id: { in: page.map(({ id }) => id) }, ownerId },
    });
    const byId = new Map(stored.map((row) => [row.id, row]));
    const ordered = page.flatMap(({ id }) => {
      const row = byId.get(id);
      return row === undefined ? [] : [row];
    });
    const views = await this.items.views(ordered);
    const last = page.at(-1);

    return {
      items: views.map((item) => ({ item, lastWornAt: item.lastWornAt })),
      nextCursor:
        rows.length > query.limit && last !== undefined ? encodeCursor(last.since, last.id) : null,
    };
  }

  /** `views` answers one view per row, in order; a gap would be a bug here, not a state. */
  private missing(id: string): never {
    throw new Error(`No view was made for item ${id}`);
  }
}
