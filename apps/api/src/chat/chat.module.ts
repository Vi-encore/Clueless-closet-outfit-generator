import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import { ConnectedUserGuard } from './connected-user.guard.js';

@Module({
  // For `verifyAccessToken`, which is how a handshake is checked without a request.
  imports: [AuthModule],
  providers: [ChatGateway, ChatService, ConnectedUserGuard],
  exports: [ChatService],
})
export class ChatModule {}
