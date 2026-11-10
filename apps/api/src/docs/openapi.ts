import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule, type StandardSchemaConverter } from '@nestjs/swagger';
import { z, type ZodType } from 'zod';
import type { Env } from '../config/env.js';
import type { StandardSchemaLike } from './docs.interfaces.js';
import { ACCESS_TOKEN_SCHEME, DOCS_PATH } from './docs.constants.js';

/**
 * Every Standard Schema records which library produced it, so recognising our own
 * schemas needs no import from zod's internals.
 */
function isZodSchema(value: unknown): value is ZodType {
  return (
    typeof value === 'object' &&
    value !== null &&
    '~standard' in value &&
    (value as StandardSchemaLike)['~standard'].vendor === 'zod'
  );
}

/**
 * Turns a zod schema attached to a route into an OpenAPI schema. zod 4 emits OpenAPI 3.0
 * itself, so the separate converter package the Nest docs suggest is not needed.
 *
 * `unrepresentable: 'any'` matters: our schemas carry refinements - the check that an item's
 * type belongs to its slot - and JSON Schema cannot express those. Without the option the
 * conversion throws instead of leaving that one rule undocumented.
 *
 * Returning `undefined` tells Swagger to fall back to its usual class-based reflection.
 */
export const zodSchemaConverter: StandardSchemaConverter = (schema, { schemaType }) => {
  if (!isZodSchema(schema)) {
    return undefined;
  }

  return {
    schema: z.toJSONSchema(schema, {
      target: 'openapi-3.0',
      io: schemaType,
      unrepresentable: 'any',
    }),
  };
};

/**
 * Mounts the documentation on an application.
 *
 * Called both from `main.ts` and from the end-to-end setup. Swagger is not a provider, so it
 * cannot be registered through the module system the way the validation pipe is; and the tests
 * build the application from `AppModule` without ever running `main.ts`, so documentation set
 * up only there would be invisible to them.
 */
export function setupOpenApi(app: INestApplication): void {
  // The document is a map of every route, field and rule the API enforces, which is
  // the first thing anyone probing a deployed service would want. It earns its keep
  // while building and nothing at all once the app is public.
  if (app.get(ConfigService<Env, true>).get('NODE_ENV', { infer: true }) === 'production') {
    return;
  }

  const documentConfig = new DocumentBuilder()
    .setTitle('Clueless Closet API')
    .setDescription('Digital wardrobe and outfit generator')
    .setVersion('0.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, ACCESS_TOKEN_SCHEME)
    .addSecurityRequirements(ACCESS_TOKEN_SCHEME)
    .build();

  SwaggerModule.setup(DOCS_PATH, app, () =>
    SwaggerModule.createDocument(app, documentConfig, {
      standardSchemaConverter: zodSchemaConverter,
    }),
  );
}
