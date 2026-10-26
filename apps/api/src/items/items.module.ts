import { Module } from '@nestjs/common';
import { FriendsModule } from '../friends/friends.module.js';
import { UsersModule } from '../users/users.module.js';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';
import { UserItemsController } from './user-items.controller.js';

@Module({
  // Visibility is a question about friendship, and a username has to become a person
  // before either can be asked.
  imports: [FriendsModule, UsersModule],
  controllers: [ItemsController, UserItemsController],
  providers: [ItemsService],
  // Exported for step 6: forwarding an item into the chat has to ask the same
  // "is this theirs" question, from a gateway rather than a controller.
  exports: [ItemsService],
})
export class ItemsModule {}
