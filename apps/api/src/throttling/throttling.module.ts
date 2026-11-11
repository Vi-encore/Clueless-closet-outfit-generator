import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import type { Env } from '../config/env.js';
import { notAnHttpRequest, perCaller, takesAPassword } from './throttling.utils.js';

/**
 * Two allowances over one window, each skipping where the other applies.
 *
 * Every throttler a module declares is checked on every route, so without `skipIf`
 * the tighter one would also limit reading a wardrobe to ten requests a minute. The
 * two conditions are each other's negation, so exactly one counts any given request.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        // `ttl` is milliseconds here; the setting is in seconds, like the token ones.
        const ttl = seconds(config.get('RATE_LIMIT_TTL', { infer: true }));

        return {
          throttlers: [
            {
              name: 'general',
              ttl,
              limit: config.get('RATE_LIMIT_MAX', { infer: true }),
              generateKey: perCaller,
              skipIf: (context) => notAnHttpRequest(context) || takesAPassword(context),
            },
            {
              name: 'password',
              ttl,
              limit: config.get('AUTH_RATE_LIMIT_MAX', { infer: true }),
              generateKey: perCaller,
              skipIf: (context) => notAnHttpRequest(context) || !takesAPassword(context),
            },
          ],
        };
      },
    }),
  ],
  providers: [
    /**
     * Registered from a module imported before `AuthModule`, so this guard runs
     * first. A flood should be refused before anything is spent on it - and on a
     * sign-in the expensive part is the argon2 verification, which is exactly what a
     * flood would be aiming to make us do over and over.
     */
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class ThrottlingModule {}
