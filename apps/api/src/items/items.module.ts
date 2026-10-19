import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService],
  // Exported for step 6: forwarding an item into the chat has to ask the same
  // "is this theirs" question, from a gateway rather than a controller.
  exports: [ItemsService],
})
export class ItemsModule {}
