import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';

/**
 * Socket.IO, told which origins it may answer.
 *
 * Its own CORS, separate from `enableCors`: Socket.IO handles its handshake itself and
 * Express never sees it, so a browser would be refused at the first request. An adapter
 * rather than `@WebSocketGateway({ cors })`, because a decorator's argument is evaluated
 * while the file is imported, long before there is a `ConfigService` to ask.
 *
 * Only the polling transport is subject to this: a true WebSocket has no CORS at all.
 * That is safe here because a connection proves itself with a token in `auth`, and
 * never with a cookie, so another site's page has no credential to ride in on.
 */
export class OriginIoAdapter extends IoAdapter {
  constructor(
    app: INestApplicationContext,
    private readonly origins: string[],
  ) {
    super(app);
  }

  override createIOServer(port: number, options?: Partial<ServerOptions>) {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: this.origins, credentials: true },
    } as ServerOptions);
  }
}
