import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

/**
 * Refuses a message from a socket carrying nobody.
 *
 * The gateway's middleware already guarantees there is somebody, so this never
 * fires today. It is here so the project's rule survives into a gateway: what has
 * to be remembered sits on the class rather than on each handler, and a handler
 * added later without a thought is closed instead of open. The same bargain
 * `@Public()` makes over HTTP, read the other way round.
 */
@Injectable()
export class ConnectedUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const socket = context.switchToWs().getClient<Socket>();

    if (!socket.data?.user) {
      throw new WsException('unauthorized');
    }

    return true;
  }
}
