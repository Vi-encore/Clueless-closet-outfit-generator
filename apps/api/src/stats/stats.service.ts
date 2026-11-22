import { SLOTS } from '@closet/core';
import { Injectable } from '@nestjs/common';
import { ItemsService } from '../items/items.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MOST_WORN, slotColumnSchema } from './stats.constants.js';
import type { CostPerWear, PricedItem, SlotCount, StatsView } from './stats.interfaces.js';
import { centsOf, colorCounts, moneyOf, perWear } from './stats.utils.js';

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

  /** `views` answers one view per row, in order; a gap would be a bug here, not a state. */
  private missing(id: string): never {
    throw new Error(`No view was made for item ${id}`);
  }
}
