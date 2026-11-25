import { Module } from '@nestjs/common';
import { ItemsModule } from '../items/items.module.js';
import { CLOCK } from './stats.constants.js';
import { StatsController } from './stats.controller.js';
import { StatsService } from './stats.service.js';

@Module({
  imports: [ItemsModule],
  controllers: [StatsController],
  // The real clock; the statistics' tests replace it with one that stands still.
  providers: [StatsService, { provide: CLOCK, useValue: () => new Date() }],
})
export class StatsModule {}
