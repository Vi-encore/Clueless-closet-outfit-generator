import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';

/**
 * Lets a browser talk to the API, and tells it how to treat what it gets back.
 *
 * Its own module for the same reason `setupOpenApi` is: these are application-level
 * hooks rather than providers, so they cannot be registered through the module system,
 * and the tests build the application from `AppModule` without ever running `main.ts`.
 * Written in one place because the two halves are one subject - a browser that is
 * allowed to read our responses is also the only thing the headers below ever address.
 */
export function setupBrowserAccess(app: INestApplication): void {
  const config: ConfigService<Env, true> = app.get(ConfigService);

  app.enableCors({
    // Named origins, never a wildcard: `credentials` and `*` are mutually exclusive,
    // and the refresh cookie needs credentials.
    origin: config.get('WEB_ORIGINS', { infer: true }),
    credentials: true,
  });

  app.useSecurityHeaders({
    contentSecurityPolicy: {
      directives: {
        // `null` removes a default directive. `upgrade-insecure-requests` rewrites
        // every http URL on a page to https, and the only page this API serves is the
        // documentation - which is served over plain http in development and not
        // served at all in production. So the directive can only ever break something
        // real, and has nothing left to protect.
        'upgrade-insecure-requests': null,
      },
    },
  });
}
