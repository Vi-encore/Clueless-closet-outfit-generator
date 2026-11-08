import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AccountView, AuthenticatedRequest } from './auth.interfaces.js';

/**
 * Hands the handler the signed-in person rather than a token payload, so no route
 * ever decodes anything or reaches into `request.user` itself.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccountView => {
    return context.switchToHttp().getRequest<AuthenticatedRequest>().user;
  },
);
