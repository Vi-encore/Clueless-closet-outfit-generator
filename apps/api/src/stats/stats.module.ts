import { Module } from '@nestjs/common';
import { ItemsModule } from '../items/items.module.js';
import { StatsController } from './stats.controller.js';
import { StatsService } from './stats.service.js';

@Module({
  imports: [ItemsModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
