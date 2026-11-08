import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Env } from '../config/env.js';
import { AuthService } from './auth.service.js';
import type { AccessTokenPayload, AccountView } from './auth.interfaces.js';

/**
 * Checks the signature and hands the claims to the service.
 *
 * Deliberately thin: everything after "this token is genuine" lives in `AuthService`,
 * so a caller without a request - the chat gateway at step 6 - can reach the same
 * logic through `verifyAccessToken` instead of faking one.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<Env, true>,
    private readonly auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
    });
  }

  /** Whatever this returns becomes `request.user`, which `@CurrentUser()` reads. */
  validate(payload: AccessTokenPayload): Promise<AccountView> {
    return this.auth.userFromPayload(payload);
  }
}
