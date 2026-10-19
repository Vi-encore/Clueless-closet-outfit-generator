import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createDatabaseApp } from './create-app.js';

let app: INestApplication<App>;
let prisma: PrismaService;

const PASSWORD = 'as if! whatever';

/** The item most of these tests start from: the minimum plus a tag worth changing. */
const blouse = {
  slot: 'top',
  type: 'blouse',
  name: 'White satin blouse',
  formality: 3,
};

beforeAll(async () => {
  app = await createDatabaseApp();
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await app.close();
});

// Items are gone with their owner, so one delete empties both tables.
beforeEach(async () => {
  await prisma.user.deleteMany();
});

interface Account {
  id: string;
  token: string;
}

/** Registers an account and signs it in, which is what every route here needs. */
async function register(username: string): Promise<Account> {
  const email = `${username}@example.com`;
  const created = await request(app.getHttpServer())
    .post('/auth/sign-up')
    .send({ email, username, password: PASSWORD });
  const signedIn = await request(app.getHttpServer())
    .post('/auth/sign-in')
    .send({ email, password: PASSWORD });

  return { id: created.body.id, token: signedIn.body.accessToken };
}

function postItem(account: Account, body: object) {
  return request(app.getHttpServer())
    .post('/items')
    .set('Authorization', `Bearer ${account.token}`)
    .send(body);
}

/** The paths of every field the response complained about. */
function errorPaths(body: { errors?: { path: string }[] }): string[] {
  return (body.errors ?? []).map((error) => error.path);
}

describe("Requirement: An item is added to the signed-in person's wardrobe", () => {
  it('Scenario: Item stored', async () => {
    const cher = await register('cher');

    const response = await postItem(cher, blouse);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ slot: 'top', type: 'blouse', name: blouse.name });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.status).toBe('available');
    expect(response.body.visibility).toBe('private');
  });

  it('Scenario: Owner comes from the token', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');

    const response = await postItem(cher, { ...blouse, ownerId: dionne.id });

    expect(response.status).toBe(201);

    const stored = await prisma.item.findUniqueOrThrow({ where: { id: response.body.id } });

    expect(stored.ownerId).toBe(cher.id);
  });

  it('Scenario: Type does not belong to the slot', async () => {
    const cher = await register('cher');

    const response = await postItem(cher, { slot: 'bottom', type: 'blouse' });

    expect(response.status).toBe(400);
    expect(errorPaths(response.body)).toContain('type');
  });

  it('Scenario: Signing in is required', async () => {
    const response = await request(app.getHttpServer()).post('/items').send(blouse);

    expect(response.status).toBe(401);
  });
});
