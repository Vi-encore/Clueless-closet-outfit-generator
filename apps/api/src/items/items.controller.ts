import { Body, Controller, Post } from '@nestjs/common';
import type { AccountView } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { Item } from '../generated/prisma/client.js';
import { ItemsService } from './items.service.js';
import { createItemRequestSchema, type CreateItemRequest } from './requests/create-item.request.js';

/**
 * No `@Public()` anywhere here, and that is the point: the global guard closes every
 * one of these routes, so the only thing left to get right is reading the owner from
 * the token rather than from the request.
 */
@Controller('items')
export class ItemsController {
  constructor(private readonly items: ItemsService) {}

  /** 201 is left as it is: this route creates something. */
  @Post()
  create(
    @CurrentUser() user: AccountView,
    @Body({ schema: createItemRequestSchema }) body: CreateItemRequest,
  ): Promise<Item> {
    return this.items.create(user.id, body);
  }
}
