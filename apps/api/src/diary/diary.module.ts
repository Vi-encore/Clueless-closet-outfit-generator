import { Module } from '@nestjs/common';
import { OutfitsModule } from '../outfits/outfits.module.js';
import { CLOCK } from './diary.constants.js';
import { DiaryController } from './diary.controller.js';
import { DiaryService } from './diary.service.js';

@Module({
  imports: [OutfitsModule],
  controllers: [DiaryController],
  // The real clock; the diary's tests replace it with one that stands still.
  providers: [DiaryService, { provide: CLOCK, useValue: () => new Date() }],
})
export class DiaryModule {}
