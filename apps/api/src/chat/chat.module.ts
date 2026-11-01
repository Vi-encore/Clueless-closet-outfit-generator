import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FriendsModule } from '../friends/friends.module.js';
import { UsersModule } from '../users/users.module.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { AuthenticatedSocketGuard } from './authenticated-socket.guard.js';
import { ChatController } from './chat.controller.js';

@Module({
  // AuthModule for `verifyAccessToken`, which is how a handshake is checked without
  // a request; the other two to turn a username into a person and ask whether the
  // two of them are friends.
  imports: [AuthModule, FriendsModule, UsersModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, AuthenticatedSocketGuard],
  exports: [ChatService],
})
export class ChatModule {}
