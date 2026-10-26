import { Module } from '@nestjs/common';
import { OutfitsController } from './outfits.controller.js';
import { OutfitsService } from './outfits.service.js';

@Module({
  controllers: [OutfitsController],
  providers: [OutfitsService],
})
export class OutfitsModule {}
