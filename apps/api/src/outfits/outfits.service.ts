import { SYSTEM_OCCASIONS, checkHardFilters, generateOutfits, scoreOutfit } from '@closet/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ItemsService } from '../items/items.service.js';
import { pageArgs, toPage } from '../pagination.js';
import type { PageQuery } from '../pagination.constants.js';
import type { Page } from '../pagination.interfaces.js';
import { isUniqueViolation } from '../prisma/errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { asDateColumn, calendarDateIn } from './calendar-date.js';
import { reactionSchema } from './requests/reaction.request.js';
import type { GenerateOutfitRequest } from './requests/generate-outfit.request.js';
import type { Reaction } from './requests/reaction.request.js';
import type { ScoreOutfitRequest } from './score-outfit.request.js';
import type {
  GenerateResponse,
  OutfitView,
  ScoreOutfitResponse,
  StoredOutfit,
  WearLogView,
} from './outfits.interfaces.js';
import { WITH_ITEMS, breakdownSchema, occasionCodeSchema } from './outfits.constants.js';
import { outfitItemsOf, slotRank, wearLogView } from './outfits.utils.js';

@Injectable()
export class OutfitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly items: ItemsService,
  ) {}

  /**
   * Hard filters first: an outfit that breaks one is not scored at all, and the caller is
   * told why rather than handed a low number it would have to interpret.
   */
  score(request: ScoreOutfitRequest): ScoreOutfitResponse {
    const filters = checkHardFilters(request.items, request.occasion);

    if (!filters.ok) {
      return { filters };
    }

    return { filters, score: scoreOutfit(request.items, request.occasion) };
  }

  /**
   * One outfit from the person's available items, stored so it can be liked, saved and worn.
   *
   * Everything is read with the owner in the `where`. A `mustInclude` id of somebody else's
   * item is then simply not among the candidates, and the answer is the same `null` as for
   * an archived item or a made-up id: nothing tells them apart from outside. A `seen` id of
   * somebody else's outfit contributes nothing, the same way.
   */
  async generate(ownerId: string, request: GenerateOutfitRequest): Promise<GenerateResponse> {
    const rows = await this.prisma.item.findMany({ where: { ownerId, status: 'available' } });
    const seen = request.seen?.length
      ? await this.prisma.outfit.findMany({
          where: { id: { in: request.seen }, ownerId },
          select: { items: { select: { itemId: true } } },
        })
      : [];

    const [made] = generateOutfits({
      items: outfitItemsOf(rows),
      occasion: SYSTEM_OCCASIONS[request.occasion],
      mustInclude: request.mustInclude,
      seen: seen.map((outfit) => outfit.items.map((item) => item.itemId)),
    });

    if (made === undefined) {
      return { outfit: null };
    }

    const rowsById = new Map(rows.map((row) => [row.id, row]));
    const stored = await this.prisma.outfit.create({
      data: {
        ownerId,
        occasion: request.occasion,
        score: made.score.total,
        breakdown: made.score.breakdown,
        items: {
          create: made.itemIds.flatMap((itemId) => {
            const row = rowsById.get(itemId);
            return row ? [{ itemId, slot: row.slot }] : [];
          }),
        },
      },
      include: WITH_ITEMS,
    });

    return { outfit: await this.view(stored) };
  }

  async findOne(ownerId: string, id: string): Promise<OutfitView> {
    return this.view(await this.ownedOrNotFound(ownerId, id));
  }

  /** The person's saved outfits, a page at a time, newest first. */
  async listSaved(ownerId: string, query: PageQuery): Promise<Page<OutfitView>> {
    const rows = await this.prisma.outfit.findMany({
      where: { ownerId, savedAt: { not: null } },
      include: WITH_ITEMS,
      ...pageArgs(query),
    });
    const page = toPage(rows, query.limit);

    return { ...page, items: await Promise.all(page.items.map((row) => this.view(row))) };
  }

  /** Sets the reaction, or takes it back with null. Setting the same one again is harmless. */
  async react(ownerId: string, id: string, reaction: Reaction | null): Promise<OutfitView> {
    await this.ownedOrNotFound(ownerId, id);

    return this.view(
      await this.prisma.outfit.update({ where: { id }, data: { reaction }, include: WITH_ITEMS }),
    );
  }

  /**
   * Saves an outfit. Idempotent: an outfit already saved keeps the moment of its first save,
   * so a retry whose answer was lost changes nothing.
   */
  async save(ownerId: string, id: string): Promise<OutfitView> {
    const stored = await this.ownedOrNotFound(ownerId, id);

    if (stored.savedAt !== null) {
      return this.view(stored);
    }

    return this.view(
      await this.prisma.outfit.update({
        where: { id },
        data: { savedAt: new Date() },
        include: WITH_ITEMS,
      }),
    );
  }

  /** Takes an outfit out of the saved ones; one that was not saved is answered as it is. */
  async unsave(ownerId: string, id: string): Promise<OutfitView> {
    const stored = await this.ownedOrNotFound(ownerId, id);

    if (stored.savedAt === null) {
      return this.view(stored);
    }

    return this.view(
      await this.prisma.outfit.update({
        where: { id },
        data: { savedAt: null },
        include: WITH_ITEMS,
      }),
    );
  }

  /**
   * Records that the outfit was worn today, in the person's time zone, and counts a wear on
   * each of its items in the same transaction, so the diary and the counts cannot disagree.
   *
   * Once a day per outfit: a record already there is answered untouched. Two requests at
   * once both miss it; the unique index fails the second insert, its transaction takes its
   * increments back with it, and it answers the record the first one wrote.
   */
  async wear(ownerId: string, id: string): Promise<WearLogView> {
    const outfit = await this.ownedOrNotFound(ownerId, id);
    const { timezone } = await this.prisma.user.findUniqueOrThrow({
      where: { id: ownerId },
      select: { timezone: true },
    });
    const now = new Date();
    const date = asDateColumn(calendarDateIn(timezone, now));
    const today = { outfitId_date: { outfitId: id, date } };

    const existing = await this.prisma.wearLog.findUnique({ where: today });
    if (existing) {
      return wearLogView(existing);
    }

    try {
      const log = await this.prisma.$transaction(async (tx) => {
        const created = await tx.wearLog.create({ data: { ownerId, outfitId: id, date } });
        await tx.item.updateMany({
          where: { id: { in: outfit.items.map((item) => item.itemId) }, ownerId },
          data: { wearCount: { increment: 1 }, lastWornAt: now },
        });
        return created;
      });

      return wearLogView(log);
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      return wearLogView(await this.prisma.wearLog.findUniqueOrThrow({ where: today }));
    }
  }

  /**
   * The single query that answers "does this exist" and "is it theirs" at once, as the
   * items' one does. 404 rather than 403, so an id of somebody else's confirms nothing.
   */
  private async ownedOrNotFound(ownerId: string, id: string): Promise<StoredOutfit> {
    const outfit = await this.prisma.outfit.findFirst({
      where: { id, ownerId },
      include: WITH_ITEMS,
    });

    if (!outfit) {
      throw new NotFoundException('No such outfit');
    }

    return outfit;
  }

  /** The outfit as the API answers with it, its items in slot order. */
  private async view(outfit: StoredOutfit): Promise<OutfitView> {
    const rows = outfit.items
      .map((outfitItem) => outfitItem.item)
      .sort((a, b) => slotRank(a.slot) - slotRank(b.slot));

    return {
      id: outfit.id,
      occasion: occasionCodeSchema.parse(outfit.occasion),
      score:
        outfit.score === null
          ? null
          : { total: outfit.score, breakdown: breakdownSchema.parse(outfit.breakdown) },
      reaction: outfit.reaction === null ? null : reactionSchema.parse(outfit.reaction),
      savedAt: outfit.savedAt,
      createdAt: outfit.createdAt,
      items: await this.items.views(rows),
    };
  }
}
