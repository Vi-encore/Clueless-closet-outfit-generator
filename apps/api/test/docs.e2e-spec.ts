import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { setupOpenApi } from '../src/docs/openapi.js';

describe('Requirement: Interactive API documentation', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupOpenApi(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Scenario: Documentation page is served', async () => {
    const response = await request(app.getHttpServer()).get('/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  it('Scenario: Document lists the health route', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json');

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.paths)).toContain('/health');
  });

  it('Scenario: Posted body appears as a schema', async () => {
    const response = await request(app.getHttpServer()).get('/docs-json');
    const schema =
      response.body.paths['/outfits/score'].post.requestBody.content['application/json'].schema;

    expect(schema.required).toEqual(expect.arrayContaining(['occasion', 'items']));
  });
});
