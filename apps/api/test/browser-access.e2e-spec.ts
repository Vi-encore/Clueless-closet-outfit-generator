import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupBrowserAccess } from '../src/browser/browser-access.js';
import { setupOpenApi } from '../src/docs/openapi.js';
import { createTestApp } from './create-app.js';

/** The origin `setup-env.ts` configures, which stands in for the Vite dev server. */
const CLIENT = 'http://localhost:5173';

/** Any other origin. The point is only that nothing names it. */
const SOMEBODY_ELSE = 'https://closet.example.com';

let app: INestApplication<App>;

beforeAll(async () => {
  app = await createTestApp((created) => {
    setupBrowserAccess(created);
    // The documentation is the only HTML this API serves, and the only thing a
    // content security policy can affect, so the policy test needs it mounted.
    setupOpenApi(created);
  });
});

afterAll(async () => {
  await app.close();
});

describe('Requirement: A browser from a known origin is answered', () => {
  it('Scenario: A known origin is allowed', async () => {
    const response = await request(app.getHttpServer()).get('/health').set('Origin', CLIENT);

    expect(response.headers['access-control-allow-origin']).toBe(CLIENT);
    // Without this the browser throws the response away however correct it is, and
    // the refresh cookie is never sent in the first place.
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('Scenario: An unknown origin is not allowed', async () => {
    const response = await request(app.getHttpServer()).get('/health').set('Origin', SOMEBODY_ELSE);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('Scenario: A preflight is answered', async () => {
    const response = await request(app.getHttpServer())
      .options('/items/00000000-0000-0000-0000-000000000000')
      .set('Origin', CLIENT)
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'authorization,content-type');

    expect(response.headers['access-control-allow-methods']).toContain('PATCH');
    expect(response.headers['access-control-allow-headers']?.toLowerCase()).toContain(
      'authorization',
    );
  });

  it('Scenario: A request with no origin is unaffected', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('Requirement: A browser from a known origin may open a socket', () => {
  /** Socket.IO's first request, before there is any socket: where a browser would stop. */
  function handshake(origin: string) {
    return request(app.getHttpServer())
      .get('/socket.io/?EIO=4&transport=polling')
      .set('Origin', origin);
  }

  it('Scenario: A known origin may connect', async () => {
    const response = await handshake(CLIENT);

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(CLIENT);
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('Scenario: An unknown origin may not', async () => {
    const response = await handshake(SOMEBODY_ELSE);

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Requirement: Responses carry security headers', () => {
  it('Scenario: The headers are there', async () => {
    const response = await request(app.getHttpServer()).get('/health');

    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('Scenario: The documentation still works over plain http', async () => {
    const response = await request(app.getHttpServer()).get('/docs');
    const policy = response.headers['content-security-policy'] ?? '';

    // The directive rewrites every http URL on the page to https. Over plain http
    // anywhere but localhost that breaks the documentation's own scripts, and the
    // API is never the thing a browser renders, so it has nothing to gain from it.
    expect(policy).not.toContain('upgrade-insecure-requests');
    // Swagger loads three scripts, all of them files beside the page itself.
    expect(policy).toContain("script-src 'self'");
  });
});
