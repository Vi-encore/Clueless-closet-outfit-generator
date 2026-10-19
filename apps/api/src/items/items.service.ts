import { Injectable } from '@nestjs/common';
import type { Item } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateItemRequest } from './requests/create-item.request.js';

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
}
