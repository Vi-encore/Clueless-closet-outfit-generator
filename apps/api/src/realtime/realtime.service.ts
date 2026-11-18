import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';
import { userRoom } from './realtime.utils.js';

/**
 * The live connections, for anything that has something to tell a person.
 *
 * The chat's gateway owns the server and hands it over in `afterInit`. It lives here
 * rather than in the chat module so that other modules can announce without depending
 * on the chat, which depends on them: friends first.
 */
@Injectable()
export class RealtimeService {
  private server?: Server;

  attach(server: Server): void {
    this.server = server;
  }

  /** The server, for the chat, which needs rooms beyond a person's. */
  get attached(): Server | undefined {
    return this.server;
  }

  /**
   * Tells every connection of one person that something happened.
   *
   * Does nothing with no server attached, which is an application that serves HTTP
   * alone: there is no connection there to tell.
   */
  toPerson(userId: string, event: string): void {
    this.server?.to(userRoom(userId)).emit(event);
  }
}
