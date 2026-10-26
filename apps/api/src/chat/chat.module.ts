import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FriendsModule } from '../friends/friends.module.js';
import { UsersModule } from '../users/users.module.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { ConnectedUserGuard } from './connected-user.guard.js';
import { ConversationsController } from './conversations.controller.js';

@Module({
  // AuthModule for `verifyAccessToken`, which is how a handshake is checked without
  // a request; the other two to turn a username into a person and ask whether the
  // two of them are friends.
  imports: [AuthModule, FriendsModule, UsersModule],
  controllers: [ConversationsController],
  providers: [ChatGateway, ChatService, ConnectedUserGuard],
  exports: [ChatService],
})
export class ChatModule {}
