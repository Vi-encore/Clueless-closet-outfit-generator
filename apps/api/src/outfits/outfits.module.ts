import { Module } from '@nestjs/common';
import { ItemsModule } from '../items/items.module.js';
import { OutfitsController } from './outfits.controller.js';
import { OutfitsService } from './outfits.service.js';

@Module({
  imports: [ItemsModule],
  controllers: [OutfitsController],
  providers: [OutfitsService],
})
export class OutfitsModule {}
