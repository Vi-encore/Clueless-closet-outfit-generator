import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type StandardSchemaConverter } from '@nestjs/swagger';
import { z, type ZodType } from 'zod';

/** Where the UI lives. The raw document is served next to it, at `<DOCS_PATH>-json`. */
export const DOCS_PATH = 'docs';

/**
 * Every Standard Schema records which library produced it, so recognising our own
 * schemas needs no import from zod's internals.
 */
function isZodSchema(value: unknown): value is ZodType {
  return (
    typeof value === 'object' &&
    value !== null &&
    '~standard' in value &&
    (value as { '~standard': { vendor?: unknown } })['~standard'].vendor === 'zod'
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
  const config = new DocumentBuilder()
    .setTitle('Clueless Closet API')
    .setDescription('Digital wardrobe and outfit generator')
    .setVersion('0.0.0')
    .build();

  SwaggerModule.setup(DOCS_PATH, app, () =>
    SwaggerModule.createDocument(app, config, { standardSchemaConverter: zodSchemaConverter }),
  );
}
