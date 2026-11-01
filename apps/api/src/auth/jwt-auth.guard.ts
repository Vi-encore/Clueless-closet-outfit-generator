import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC } from './public.decorator.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    /**
     * Which contexts this guard covers, said out loud.
     *
     * A global guard runs for a gateway's message handlers too, and this one
     * cannot do its job there: it extends Passport's, which reads the request's
     * `authorization` header, and a socket message has no request to read. Left
     * to try, it does not refuse the message - it throws a `TypeError` on
     * `undefined.authorization`, which is a bug wearing a refusal's clothes.
     *
     * Letting a socket through is therefore correct rather than lax: by the time
     * a message handler runs, the connection was authenticated at its handshake
     * and `AuthenticatedSocketGuard` has checked that somebody is on it. The two
     * guards are not merged for the same reason they both exist - they protect
     * at different moments, one on every request and one once per connection.
     *
     * Anything else is a context nobody here designed for, and saying so is
     * cheaper to debug than quietly allowing it.
     */
    switch (context.getType<string>()) {
      case 'http':
        break;
      case 'ws':
        return true;
      default:
        throw new Error(`JwtAuthGuard does not cover ${context.getType<string>()} contexts`);
    }

    // Both levels, so a controller can open all of its routes at once.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    return isPublic ? true : super.canActivate(context);
  }
}
