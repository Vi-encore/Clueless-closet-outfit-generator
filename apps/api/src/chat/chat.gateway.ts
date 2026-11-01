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
import type { MessageView, SentMessage } from './chat.interfaces.js';
import { ChatService } from './chat.service.js';
import { AuthenticatedSocketGuard } from './authenticated-socket.guard.js';
import { sendMessageRequestSchema } from './requests/send-message.request.js';
import { conversationRoom, userRoom } from './rooms.js';

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

@UseGuards(AuthenticatedSocketGuard)
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

  @SubscribeMessage('message:send')
  async send(@ConnectedSocket() socket: Socket, @MessageBody() payload: unknown): Promise<SendAck> {
    const parsed = sendMessageRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return { ok: false, error: 'Message is not in the expected shape' };
    }

    try {
      const sent = await this.chat.send(socket.data.user as AccountView, parsed.data);
      this.deliver(sent);

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
   * Puts the message in front of both people.
   *
   * A conversation made by this very message has a room the recipient's sockets
   * never joined - they connected before it existed. They are reachable by the
   * room they are always in, so the server pulls them across.
   */
  private deliver(sent: SentMessage): void {
    const room = conversationRoom(sent.conversationId);

    if (sent.conversationCreated) {
      // Not awaited, and not awaitable: with the in-memory adapter this returns
      // nothing. A Redis adapter, when there is one, would want the promise form.
      this.server.in(userRoom(sent.recipientId)).socketsJoin(room);
      this.server.in(userRoom(sent.senderId)).socketsJoin(room);
    }

    // To the room rather than to the recipient: it reaches the sender's other
    // devices too, which is what somebody with a phone and a laptop expects.
    this.server.to(room).emit('message', sent.message);
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
