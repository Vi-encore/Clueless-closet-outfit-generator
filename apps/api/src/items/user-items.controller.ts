import { Controller, Get, Param } from '@nestjs/common';
import type { AccountView } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { Item } from '../generated/prisma/client.js';
import { usernameSchema } from '../users/username.js';
import { ItemsService } from './items.service.js';

/**
 * Mounted under `/users` but owned by the items module, and that is not an accident.
 *
 * The friends module needs the users module to turn a name into a person, so a route
 * living in the users module could not ask about friendship without a cycle. It
 * returns items, so it belongs here, where importing both is free.
 */
@Controller('users')
export class UserItemsController {
  constructor(private readonly items: ItemsService) {}

  @Get(':username/items')
  list(
    @CurrentUser() user: AccountView,
    @Param('username', { schema: usernameSchema }) username: string,
  ): Promise<Item[]> {
    return this.items.listVisibleTo(user.id, username);
  }
}
