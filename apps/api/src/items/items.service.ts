import { Injectable, NotFoundException } from '@nestjs/common';
import type { Item } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateItemRequest } from './requests/create-item.request.js';
import type { ListItemsQuery } from './requests/list-items.query.js';

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
