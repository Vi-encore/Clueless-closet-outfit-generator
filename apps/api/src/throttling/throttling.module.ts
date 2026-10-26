import { Module, type ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  ThrottlerGuard,
  ThrottlerModule,
  seconds,
  type ThrottlerGenerateKeyFunction,
} from '@nestjs/throttler';
import type { Env } from '../config/env.js';
import { PASSWORD_ROUTE } from './password-route.decorator.js';

/**
 * Whether the handler is one of the routes that takes a password.
 *
 * Read straight off the handler rather than through `Reflector`, because this runs
 * inside the throttler's own configuration, where there is no injector to ask.
 */
function takesAPassword(context: ExecutionContext): boolean {
  return Reflect.getMetadata(PASSWORD_ROUTE, context.getHandler()) === true;
}

/**
 * These allowances are about requests, and a global guard also runs for a
 * gateway's message handlers - where there is no request to count, and the
 * tracker would end up keyed on `undefined` for everybody at once.
 *
 * Flooding a socket is a real concern and a different one; nothing addresses it
 * yet, and pretending this does would be worse than leaving it named.
 */
function notAnHttpRequest(context: ExecutionContext): boolean {
  return context.getType() !== 'http';
}

/**
 * One bucket per caller per allowance, rather than one per caller per route.
 *
 * The library's default key is `Class-handler-throttler`, which quietly multiplies
 * the allowance by the number of routes it covers: ten sign-ins, ten sign-ups and
 * ten refreshes a minute is thirty argon2 hashes, not ten. A limit is meant to say
 * how much one caller may ask for, not how much they may ask of each thing they
 * happen to be able to name.
 */
const perCaller: ThrottlerGenerateKeyFunction = (_context, tracker, name) => `${name}:${tracker}`;

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
