import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { asDateColumn, calendarDateIn, fromDateColumn } from '../outfits/calendar-date.js';
import { OutfitsService } from '../outfits/outfits.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { keyFor, ownerOf } from '../storage/keys.js';
import type { UploadTarget } from '../storage/storage.interfaces.js';
import { StorageService } from '../storage/storage.service.js';
import { CLOCK, DIARY_ORDER, MEMORY_KINDS, WITH_OUTFIT } from './diary.constants.js';
import type { Clock, DiaryEntry, Memory, StoredEntry } from './diary.interfaces.js';
import { memoryDates, monthRange } from './diary.utils.js';
import type { UpdateEntryRequest } from './requests/update-entry.request.js';

/**
 * The diary is the wear records seen as days: what was worn, and the note and photo a
 * person adds to it. Every read and write names the owner, so nobody sees another's days.
 */
@Injectable()
export class DiaryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outfits: OutfitsService,
    private readonly storage: StorageService,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** The person's days in one month, `YYYY-MM`, in date order. */
  async month(ownerId: string, month: string): Promise<DiaryEntry[]> {
    const { from, to } = monthRange(month);
    const rows = await this.prisma.wearLog.findMany({
      where: { ownerId, date: { gte: asDateColumn(from), lt: asDateColumn(to) } },
      include: WITH_OUTFIT,
      orderBy: [...DIARY_ORDER],
    });

    return Promise.all(rows.map((row) => this.describe(row)));
  }

  /** The days exactly a year and a month before today, in the person's time zone. */
  async memories(ownerId: string): Promise<Memory[]> {
    const { timezone } = await this.prisma.user.findUniqueOrThrow({
      where: { id: ownerId },
      select: { timezone: true },
    });
    const dates = memoryDates(calendarDateIn(timezone, this.clock()));

    const found = await Promise.all(
      MEMORY_KINDS.map(async (kind) => {
        const date = dates[kind];

        if (date === null) {
          return [];
        }

        const rows = await this.prisma.wearLog.findMany({
          where: { ownerId, date: asDateColumn(date) },
          include: WITH_OUTFIT,
          orderBy: [...DIARY_ORDER],
        });

        return Promise.all(rows.map(async (row) => ({ kind, entry: await this.describe(row) })));
      }),
    );

    return found.flat();
  }

  uploadUrl(ownerId: string, contentType: string): Promise<UploadTarget> {
    return this.storage.uploadUrl(keyFor('diary', ownerId, contentType), contentType);
  }

  /**
   * Sets or clears the day's note and photo.
   *
   * The photo key comes back through the client, so it is checked as an item's is: it must
   * be a diary key issued to this person. A photo it replaces is removed afterwards, and a
   * failure there is only logged, because by then the day is already right.
   */
  async update(ownerId: string, id: string, request: UpdateEntryRequest): Promise<DiaryEntry> {
    const stored = await this.prisma.wearLog.findFirst({ where: { id, ownerId } });

    if (!stored) {
      throw new NotFoundException('No such day in the diary');
    }

    const { photoKey } = request;
    if (photoKey !== undefined && photoKey !== null && ownerOf('diary', photoKey) !== ownerId) {
      throw new BadRequestException('That photo key was not issued to you');
    }

    const updated = await this.prisma.wearLog.update({
      where: { id },
      data: { note: request.note, photoKey },
      include: WITH_OUTFIT,
    });

    if (stored.photoKey !== null && stored.photoKey !== updated.photoKey) {
      await this.storage.remove(stored.photoKey);
    }

    return this.describe(updated);
  }

  private async describe(row: StoredEntry): Promise<DiaryEntry> {
    return {
      id: row.id,
      date: fromDateColumn(row.date),
      note: row.note,
      photoUrl: row.photoKey === null ? null : await this.storage.viewUrl(row.photoKey),
      outfit: await this.outfits.describe(row.outfit),
    };
  }
}
