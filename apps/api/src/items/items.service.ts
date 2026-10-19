import { itemTagsSchema, type ArchiveReason } from '@closet/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { Item } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { validationException } from '../validation/validation-exception.js';
import type { CreateItemRequest } from './requests/create-item.request.js';
import type { ListItemsQuery } from './requests/list-items.query.js';
import type { UpdateItemRequest } from './requests/update-item.request.js';

/**
 * The stored row reduced to the tags `itemTagsSchema` describes.
 *
 * Two translations happen here. The row carries columns the schema knows nothing
 * about, and it answers `null` where a tag was never filled in - while an optional
 * field accepts `undefined` and refuses `null`. Feeding the row in untouched would
 * fail on every tag the owner has not got round to yet.
 */
function tagsOf(item: Item): Record<string, unknown> {
  const tags: Record<string, unknown> = {};

  for (const key of Object.keys(itemTagsSchema.shape)) {
    const value = (item as unknown as Record<string, unknown>)[key];

    if (value !== null && value !== undefined) {
      tags[key] = value;
    }
  }

  return tags;
}

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adds an item to one person's wardrobe.
   *
   * The owner is a parameter rather than a field of the request, and that is the whole
   * defence: zod strips keys it does not know, so an `ownerId` sent in the body is gone
   * before this method is reached, and this line is the only place the column is set.
   */
  create(ownerId: string, input: CreateItemRequest): Promise<Item> {
    return this.prisma.item.create({ data: { ...input, ownerId } });
  }

  /** One person's wardrobe, narrowed by whatever they asked for. */
  list(ownerId: string, query: ListItemsQuery): Promise<Item[]> {
    return this.prisma.item.findMany({
      where: {
        ownerId,
        slot: query.slot,
        status: query.status ?? { not: 'archived' },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * One item, if it is theirs.
   *
   * This is also the public face of the ownership check: a caller that holds an id
   * and a user - the chat gateway in step 6, forwarding an item into a conversation -
   * asks this and gets either the item or the same 404 everybody else gets.
   */
  findOne(ownerId: string, id: string): Promise<Item> {
    return this.ownedOrNotFound(ownerId, id);
  }

  /**
   * Corrects an item's tags.
   *
   * The pipe has already checked that each field is a legal value on its own; what it
   * could not check is the one rule that needs two fields at once. A patch may carry
   * `type` without `slot`, so the pair is judged here, against the item as it will be
   * rather than as the request describes it.
   */
  async update(ownerId: string, id: string, patch: UpdateItemRequest): Promise<Item> {
    const stored = await this.ownedOrNotFound(ownerId, id);
    const merged = itemTagsSchema.safeParse({ ...tagsOf(stored), ...patch });

    if (!merged.success) {
      // Raised in the pipe's own shape. A client that meets two different formats for
      // the same kind of mistake has to learn both, and will get one of them wrong.
      throw validationException(merged.error.issues);
    }

    // `patch` holds only the keys that were sent, so everything else is left alone.
    return this.prisma.item.update({ where: { id }, data: patch });
  }

  /**
   * Takes an item out of the wardrobe without taking it out of the database.
   *
   * Outfit history and statistics keep pointing at items long after their owner has
   * stopped wearing them, so `DELETE` is a change of status rather than a row going
   * away. Real deletion is an explicit act that does not exist yet.
   */
  async archive(ownerId: string, id: string, reason?: ArchiveReason): Promise<Item> {
    const stored = await this.ownedOrNotFound(ownerId, id);

    if (stored.status === 'archived') {
      // Already where the request wanted it. Archiving states something about the
      // world rather than recording an event, so a client retrying a request whose
      // answer it never saw is right, not wrong - and the moment the item actually
      // left the wardrobe is the first one, which the history cares about.
      return stored;
    }

    return this.prisma.item.update({
      where: { id },
      data: { status: 'archived', archivedAt: new Date(), archivedReason: reason ?? null },
    });
  }

  /**
   * The single query that answers "does this exist" and "is it theirs" at once.
   *
   * Nothing here may fetch an item by id alone. Asking the two questions separately
   * is how an IDOR bug is born: the second one gets forgotten in one method, or
   * written slightly differently in the next.
   */
  private async ownedOrNotFound(ownerId: string, id: string): Promise<Item> {
    const item = await this.prisma.item.findFirst({ where: { id, ownerId } });

    if (!item) {
      // Not 403. That would confirm the id belongs to somebody, which is the one
      // thing worth withholding from whoever is working through guesses.
      throw new NotFoundException('No such item');
    }

    return item;
  }
}
