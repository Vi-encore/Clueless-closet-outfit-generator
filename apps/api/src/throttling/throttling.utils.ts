import { type ExecutionContext } from '@nestjs/common';
import { type ThrottlerGenerateKeyFunction } from '@nestjs/throttler';
import { PASSWORD_ROUTE } from './throttling.constants.js';

/**
 * Whether the handler is one of the routes that takes a password.
 *
 * Read straight off the handler rather than through `Reflector`, because this runs
 * inside the throttler's own configuration, where there is no injector to ask.
 */
export function takesAPassword(context: ExecutionContext): boolean {
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
export function notAnHttpRequest(context: ExecutionContext): boolean {
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
export const perCaller: ThrottlerGenerateKeyFunction = (_context, tracker, name) =>
  `${name}:${tracker}`;
