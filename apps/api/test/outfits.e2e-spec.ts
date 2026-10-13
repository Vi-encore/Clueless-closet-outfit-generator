import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';

const WORK = { code: 'work', targetFormality: 3 };

const whiteBlouse = {
  id: 'blouse',
  slot: 'top',
  type: 'blouse',
  colors: [{ family: 'white', hex: '#f5f5f5', share: 1 }],
  formality: 3,
};

const denimJeans = {
  id: 'jeans',
  slot: 'bottom',
  type: 'jeans',
  colors: [{ family: 'denim', hex: '#3b5b8c', share: 1 }],
  formality: 2,
};

let app: INestApplication<App>;

beforeAll(async () => {
  const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleFixture.createNestApplication();
  await app.init();
});

afterAll(async () => {
  await app.close();
});

function post(body: object) {
  return request(app.getHttpServer()).post('/outfits/score').send(body);
}

/** The paths of every field the response complained about. */
function errorPaths(body: { errors?: { path: string }[] }): string[] {
  return (body.errors ?? []).map((error) => error.path);
}

describe('Requirement: Invalid request data is rejected', () => {
  it('Scenario: Field error listed', async () => {
    const response = await post({
      occasion: WORK,
      items: [{ id: 'b1', slot: 'bottom', type: 'blouse' }],
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(errorPaths(response.body)).toContain('items.0.type');
  });

  it('Scenario: Several errors at once', async () => {
    const response = await post({
      occasion: { code: 'work', targetFormality: 9 },
      items: [{ id: 'b1', slot: 'top', type: 'blouse', formality: 0 }],
    });

    expect(response.status).toBe(400);
    expect(errorPaths(response.body)).toEqual(
      expect.arrayContaining(['occasion.targetFormality', 'items.0.formality']),
    );
  });
});

describe('Requirement: Score a posted outfit', () => {
  it('Scenario: Outfit scored', async () => {
    const response = await post({ occasion: WORK, items: [whiteBlouse, denimJeans] });

    expect(response.status).toBe(200);
    expect(response.body.filters).toEqual({ ok: true });
    expect(response.body.score).toEqual({
      total: 1.25,
      breakdown: { color: 0.5, formality: 0.75 },
    });
  });

  it('Scenario: Empty outfit rejected', async () => {
    const response = await post({ occasion: WORK, items: [] });

    expect(response.status).toBe(400);
    expect(errorPaths(response.body)).toContain('items');
  });
});

describe('Requirement: Rejected outfit explained', () => {
  it('Scenario: Formality gap explained', async () => {
    const response = await post({
      occasion: WORK,
      items: [
        { ...whiteBlouse, formality: 1 },
        { ...denimJeans, formality: 4 },
      ],
    });

    expect(response.status).toBe(200);
    expect(response.body.filters.ok).toBe(false);
    expect(response.body.filters.reasons).toContainEqual({ kind: 'formality_gap', gap: 3 });
    expect(response.body).not.toHaveProperty('score');
  });
});
