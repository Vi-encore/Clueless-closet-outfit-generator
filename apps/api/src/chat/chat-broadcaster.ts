import { Injectable } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';
import type { SentMessage } from './chat.interfaces.js';
import { conversationRoom, userRoom } from './chat.utils.js';

/**
 * Everything that knows a room exists.
 *
 * Separated from the gateway because it is the one thing here with a second
 * reason to change: the day a second instance needs the Socket.IO Redis
 * adapter, rooms stop being local to a process, and exactly this file has to
 * learn that. The gateway's job - receive an event, ask the service, answer the
 * sender - does not move at all.
 */
@Injectable()
export class ChatBroadcaster {
  private server?: Server;

  /**
   * The gateway hands the server over once it exists.
   *
   * `@WebSocketServer()` only populates on the gateway, so there is no way to
   * inject it here; this is the seam. It is called from `afterInit`, before any
   * connection can be accepted.
   */
  attach(server: Server): void {
    this.server = server;
  }

  /** Puts a freshly connected socket in the rooms it can be reached through. */
  async welcome(socket: Socket, userId: string, conversationIds: string[]): Promise<void> {
    await socket.join([userRoom(userId), ...conversationIds.map(conversationRoom)]);
  }

  /**
   * Puts a message in front of both people.
   *
   * A conversation made by this very message has a room the recipient's sockets
   * never joined - they connected before it existed. They are reachable by the
   * room they are always in, so they are pulled across first.
   */
  deliver(sent: SentMessage): void {
    const server = this.attached();
    const room = conversationRoom(sent.conversationId);

    if (sent.conversationCreated) {
      // Not awaited, and not awaitable: with the in-memory adapter this returns
      // nothing. A Redis adapter, when there is one, would want the promise form.
      server.in(userRoom(sent.recipientId)).socketsJoin(room);
      server.in(userRoom(sent.senderId)).socketsJoin(room);
    }

    // To the room rather than to the recipient: it reaches the sender's other
    // devices too, which is what somebody with a phone and a laptop expects.
    server.to(room).emit('message', sent.message);
  }

  /**
   * Tells somebody who is typing to them. To their own room rather than the
   * conversation's: a first message has no conversation yet, and neither has this.
   */
  typing(recipientId: string, username: string): void {
    this.attached().to(userRoom(recipientId)).emit('typing', { username });
  }

  private attached(): Server {
    if (this.server === undefined) {
      // Cannot happen through the gateway, which attaches in `afterInit`. Said
      // out loud anyway: a silent no-op here would be a message that vanished.
      throw new Error('ChatBroadcaster was used before a server was attached');
    }

    return this.server;
  }
}
