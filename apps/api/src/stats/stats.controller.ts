import { Controller, Get } from '@nestjs/common';
import type { AccountView } from '../auth/auth.interfaces.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { StatsView } from './stats.interfaces.js';
import { StatsService } from './stats.service.js';

@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  summary(@CurrentUser() user: AccountView): Promise<StatsView> {
    return this.stats.summary(user.id);
  }
}
