import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AccountView } from './auth.service.js';

/**
 * Hands the handler the signed-in person rather than a token payload, so no route
 * ever decodes anything or reaches into `request.user` itself.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccountView => {
    return context.switchToHttp().getRequest<{ user: AccountView }>().user;
  },
);
