import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { StorageService } from '../src/storage/storage.service.js';
import { createDatabaseApp } from './create-app.js';

let app: INestApplication<App>;
let prisma: PrismaService;
let storage: StorageService;

const PASSWORD = 'as if! whatever';
const STORAGE = 'http://localhost:9000';
const BUCKET = 'closet-photos-test';

beforeAll(async () => {
  app = await createDatabaseApp();
  prisma = app.get(PrismaService);
  storage = app.get(StorageService);
  // Made here rather than by the application, which must never create its own:
  // a key scoped to one bucket has no right to.
  await storage.ensureBucket();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await prisma.user.deleteMany();
});

interface Account {
  id: string;
  token: string;
}

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

function askForUrl(account: Account, contentType = 'image/webp') {
  return request(app.getHttpServer())
    .post('/items/upload-url')
    .set('Authorization', `Bearer ${account.token}`)
    .send({ contentType });
}

describe('Requirement: An upload URL is issued to the person asking', () => {
  it('Scenario: A URL and a key come back', async () => {
    const cher = await register('cher');

    const response = await askForUrl(cher);

    expect(response.status).toBe(201);
    expect(response.body.key).toEqual(expect.any(String));
    expect(response.body.url).toContain('X-Amz-Signature');
    expect(response.body.expiresIn).toBe(300);
  });

  it('Scenario: The key names its owner', async () => {
    const cher = await register('cher');

    const first = await askForUrl(cher);
    const second = await askForUrl(cher);

    expect(first.body.key).toContain(cher.id);
    // Two photographs from one person must not land on each other.
    expect(second.body.key).not.toBe(first.body.key);
  });

  it('Scenario: Only images are accepted', async () => {
    const cher = await register('cher');

    const response = await askForUrl(cher, 'application/pdf');

    expect(response.status).toBe(400);
  });

  it('Scenario: Signing in is required', async () => {
    const response = await request(app.getHttpServer())
      .post('/items/upload-url')
      .send({ contentType: 'image/webp' });

    expect(response.status).toBe(401);
  });
});

describe('Requirement: The presigned URL really carries the upload', () => {
  it('Scenario: Bytes go up and come back', async () => {
    const cher = await register('cher');
    const { body } = await askForUrl(cher);

    // No credentials of any kind on this request: the signature in the URL is
    // the whole of its authority, which is the thing worth proving.
    const uploaded = await fetch(body.url, {
      method: 'PUT',
      body: 'a photograph, more or less',
      headers: { 'content-type': 'image/webp' },
    });

    expect(uploaded.status).toBe(200);

    const read = await fetch(await storage.viewUrl(body.key));

    expect(read.status).toBe(200);
    expect(await read.text()).toBe('a photograph, more or less');
  });

  it('Scenario: An unsigned request is refused', async () => {
    const cher = await register('cher');
    const { body } = await askForUrl(cher);

    const refused = await fetch(`${STORAGE}/${BUCKET}/${body.key}`, {
      method: 'PUT',
      body: 'not mine to put',
      headers: { 'content-type': 'image/webp' },
    });

    expect(refused.status).toBe(403);
  });
});
