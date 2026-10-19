import { SetMetadata } from '@nestjs/common';

export const PASSWORD_ROUTE = 'throttle:password-route';

/**
 * Marks a route that accepts a password, so the tighter allowance applies to it.
 *
 * Opt-in rather than opt-out, which is the opposite of how `@Public()` works and for
 * the opposite reason: forgetting this one leaves a route on the general allowance,
 * which is merely looser. Forgetting `@Public()` would leave a route closed, which is
 * safe. Neither mistake opens anything.
 */
export const PasswordRoute = () => SetMetadata(PASSWORD_ROUTE, true);
