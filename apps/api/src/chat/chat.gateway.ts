import { HttpException, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayInit,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { AuthService, type AccountView } from '../auth/auth.service.js';
import { AuthenticatedSocketGuard } from './authenticated-socket.guard.js';
import { ChatBroadcaster } from './chat-broadcaster.js';
import type { MessageView } from './chat.interfaces.js';
import { ChatService } from './chat.service.js';
import { sendMessageRequestSchema } from './requests/send-message.request.js';

/**
 * What the sender's callback is handed, always.
 *
 * A refusal travels in the acknowledgement rather than as an `exception` event,
 * which is why the payload is checked inside the handler instead of by the global
 * pipe: a pipe runs before the handler and its failure would escape the callback,
 * leaving the client to race an acknowledgement against an event. The sender
 * passed one callback and learns the fate of their message in it.
 */
export type SendAck = { ok: true; message: MessageView } | { ok: false; error: string };

/**
 * The socket, and nothing else.
 *
 * What a message means is `ChatService`; how one reaches people is
 * `ChatBroadcaster`. What is left here is the transport: accepting a
 * connection, receiving an event, answering the sender.
 */
@UseGuards(AuthenticatedSocketGuard)
@WebSocketGateway()
export class ChatGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() private readonly server!: Server;

  constructor(
    private readonly auth: AuthService,
    private readonly chat: ChatService,
    private readonly broadcaster: ChatBroadcaster,
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
    this.broadcaster.attach(server);

    server.use((socket, next) => {
      void this.identify(socket).then(
        () => next(),
        () => next(new Error('unauthorized')),
      );
    });
  }

  async handleConnection(socket: Socket): Promise<void> {
    const user = socket.data.user as AccountView;
    const conversations = await this.chat.conversationIdsOf(user.id);

    await this.broadcaster.welcome(socket, user.id, conversations);
  }

  @SubscribeMessage('message:send')
  async send(@ConnectedSocket() socket: Socket, @MessageBody() payload: unknown): Promise<SendAck> {
    const parsed = sendMessageRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return { ok: false, error: 'Message is not in the expected shape' };
    }

    try {
      const sent = await this.chat.send(socket.data.user as AccountView, parsed.data);
      this.broadcaster.deliver(sent);

      return { ok: true, message: sent.message };
    } catch (error) {
      // A refusal the service made deliberately is an answer; anything else is a
      // bug, and disguising it as `{ ok: false }` would hide it from the logs.
      if (error instanceof HttpException) {
        return { ok: false, error: error.message };
      }

      throw error;
    }
  }

  /**
   * Stays here, where delivery did not.
   *
   * Six lines that exist to be handed to `server.use` on the line above them. A
   * file of its own would buy a name and cost a jump, and separation pays when
   * it isolates a reason to change - this has none of its own. The day a second
   * way to prove who a connection belongs to appears, that is the moment.
   */
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
