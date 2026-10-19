import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { FriendsController } from './friends.controller.js';
import { FriendsService } from './friends.service.js';

@Module({
  imports: [UsersModule],
  controllers: [FriendsController],
  providers: [FriendsService],
  // `areFriends` is asked by the wardrobe when a friend reads it, and will be asked
  // by the chat gateway in add-chat.
  exports: [FriendsService],
})
export class FriendsModule {}
