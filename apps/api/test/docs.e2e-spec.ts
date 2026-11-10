import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupOpenApi } from '../src/docs/openapi.js';
import { ACCESS_TOKEN_SCHEME } from '../src/docs/docs.constants.js';
import { createTestApp } from './create-app.js';

let app: INestApplication<App>;

beforeAll(async () => {
  app = await createTestApp(setupOpenApi);
});

afterAll(async () => {
  await app.close();
});

/** The document itself, which every scenario below asks something of. */
function fetchDocument() {
  return request(app.getHttpServer()).get('/docs-json');
}

describe('Requirement: Interactive API documentation', () => {
  it('Scenario: Documentation page is served', async () => {
    const response = await request(app.getHttpServer()).get('/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  it('Scenario: Document lists the health route', async () => {
    const response = await fetchDocument();

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.paths)).toContain('/health');
  });

  it('Scenario: Posted body appears as a schema', async () => {
    const response = await fetchDocument();
    const schema =
      response.body.paths['/outfits/score'].post.requestBody.content['application/json'].schema;

    expect(schema.required).toEqual(expect.arrayContaining(['occasion', 'items']));
  });
});

describe('Requirement: The documentation says what a route needs', () => {
  it('Scenario: A token can be supplied', async () => {
    const response = await fetchDocument();
    const scheme = response.body.components.securitySchemes[ACCESS_TOKEN_SCHEME];

    expect(scheme).toMatchObject({ type: 'http', scheme: 'bearer' });
  });

  it('Scenario: A protected route requires the token', async () => {
    const response = await fetchDocument();

    // The requirement is written once, at the root, and inherited by every operation
    // that does not replace it - which is what leaves a protected route needing no
    // decorator of its own.
    expect(response.body.security).toContainEqual({ [ACCESS_TOKEN_SCHEME]: [] });
    expect(response.body.paths['/auth/me'].get.security).toBeUndefined();
  });

  it('Scenario: A public route requires nothing', async () => {
    const response = await fetchDocument();
    const publicRoutes = [
      response.body.paths['/auth/sign-up'].post,
      response.body.paths['/auth/sign-in'].post,
      response.body.paths['/auth/refresh'].post,
      response.body.paths['/health'].get,
    ];

    // `[{}]` is OpenAPI for "satisfied by presenting nothing": an operation's own
    // security replaces the root one, so opting out means writing an empty demand
    // rather than omitting the field.
    for (const operation of publicRoutes) {
      expect(operation.security).toEqual([{}]);
    }
  });
});
