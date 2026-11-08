import { Controller, Get, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { usernameSchema } from '../users/username.js';
import { pageQuerySchema, type PageQuery } from '../pagination.js';
import { ItemsService } from './items.service.js';
import type { Page } from '../pagination.interfaces.js';
import type { AccountView } from '../auth/auth.interfaces.js';
import type { ItemView } from './items.interfaces.js';

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

  /** Paged like the owner's own wardrobe, but without its filters: a friend reads
   * what was opened to them, not a view they get to narrow. */
  @Get(':username/items')
  list(
    @CurrentUser() user: AccountView,
    @Param('username', { schema: usernameSchema }) username: string,
    @Query({ schema: pageQuerySchema }) query: PageQuery,
  ): Promise<Page<ItemView>> {
    return this.items.listVisibleTo(user.id, username, query);
  }
}
