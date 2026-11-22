import { Controller, Get, Query } from '@nestjs/common';
import type { Page } from '../pagination.interfaces.js';
import type { AccountView } from '../auth/auth.interfaces.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { StatsView, UnwornItem } from './stats.interfaces.js';
import { unwornQuerySchema, type UnwornQuery } from './requests/unworn.query.js';
import { StatsService } from './stats.service.js';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  summary(@CurrentUser() user: AccountView): Promise<StatsView> {
    return this.stats.summary(user.id);
  }

  @Get('unworn')
  unworn(
    @CurrentUser() user: AccountView,
    @Query({ schema: unwornQuerySchema }) query: UnwornQuery,
  ): Promise<Page<UnwornItem>> {
    return this.stats.unworn(user.id, query);
  }
}
