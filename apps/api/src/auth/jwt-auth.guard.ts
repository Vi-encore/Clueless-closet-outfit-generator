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
     * A global guard runs for a gateway's message handlers too, and this one
     * cannot do its job there: it extends Passport's, which reads the request's
     * `authorization` header, and a socket message has no request to read. Left
     * alone it does not refuse the message - it throws a `TypeError` on
     * `undefined.authorization`, which is a bug wearing a refusal's clothes.
     *
     * A socket is guarded where its identity is established instead: the
     * gateway's handshake middleware, and `ConnectedUserGuard` behind it.
     */
    if (context.getType() !== 'http') {
      return true;
    }

    // Both levels, so a controller can open all of its routes at once.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);

    return isPublic ? true : super.canActivate(context);
  }
}
