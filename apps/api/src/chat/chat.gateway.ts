import { UseGuards } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayInit,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AuthService, type AccountView } from '../auth/auth.service.js';
import { ChatService } from './chat.service.js';
import { ConnectedUserGuard } from './connected-user.guard.js';
import { conversationRoom, userRoom } from './rooms.js';

@UseGuards(ConnectedUserGuard)
@WebSocketGateway()
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() private readonly server!: Server;

  constructor(
    private readonly auth: AuthService,
    private readonly chat: ChatService,
  ) {}

  /**
   * Identity is established in middleware, not in `handleConnection`.
   *
   * By the time `handleConnection` runs the connection exists, and verifying means
   * a database lookup - so a client that emits immediately is racing the
   * disconnect, and that race is exactly the window in which an unauthenticated
   * socket gets heard. Middleware runs before the connection is accepted at all,
   * and `next(error)` means there is never a socket to emit at.
   */
  afterInit(server: Server): void {
    server.use((socket, next) => {
      void this.identify(socket).then(
        () => next(),
        () => next(new Error('unauthorized')),
      );
    });
  }

  /** Joins the rooms this person is reachable through. */
  async handleConnection(socket: Socket): Promise<void> {
    const user = socket.data.user as AccountView;
    const conversations = await this.chat.conversationIdsOf(user.id);

    await socket.join([userRoom(user.id), ...conversations.map(conversationRoom)]);
  }

  private async identify(socket: Socket): Promise<void> {
    const token: unknown = socket.handshake.auth?.token;

    if (typeof token !== 'string') {
      throw new Error('no token');
    }

    // The method step 4 built for exactly this: a Passport strategy needs a request
    // to run against, and a handshake is not one.
    socket.data.user = await this.auth.verifyAccessToken(token);
  }
}
