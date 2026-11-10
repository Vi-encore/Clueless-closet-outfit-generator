import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Requirement: The flags can be read by anybody', () => {
  let app: INestApplication<App>;
  let before: string | undefined;

  beforeAll(async () => {
    before = process.env.FEATURES_OFF;
    process.env.FEATURES_OFF = 'photoCutout';
    // Imported only now: `ConfigModule.forRoot` reads the environment when `AppModule` is
    // first loaded, and a static import would load it before the line above runs.
    const { createTestApp } = await import('./create-app.js');
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();

    if (before === undefined) {
      delete process.env.FEATURES_OFF;
    } else {
      process.env.FEATURES_OFF = before;
    }
  });

  it('Scenario: The flags are answered', async () => {
    const response = await request(app.getHttpServer()).get('/flags');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ photoCutout: false });
  });
});
