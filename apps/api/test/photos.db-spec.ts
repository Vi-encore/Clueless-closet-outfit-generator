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

const blouse = { slot: 'top', type: 'blouse', name: 'White blouse' };

function postItem(account: Account, body: object) {
  return request(app.getHttpServer())
    .post('/items')
    .set('Authorization', `Bearer ${account.token}`)
    .send(body);
}

function listItems(account: Account) {
  return request(app.getHttpServer()).get('/items').set('Authorization', `Bearer ${account.token}`);
}

function getItem(account: Account, id: string) {
  return request(app.getHttpServer())
    .get(`/items/${id}`)
    .set('Authorization', `Bearer ${account.token}`);
}

/** A key that really was issued, and a file really sitting behind it. */
async function uploadedPhoto(account: Account, body = 'a photograph'): Promise<string> {
  const { body: target } = await askForUrl(account);
  await fetch(target.url, {
    method: 'PUT',
    body,
    headers: { 'content-type': 'image/webp' },
  });

  return target.key;
}

describe('Requirement: A key belongs to whoever it was issued to', () => {
  it("Scenario: Somebody else's key is refused", async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    const cherKey = (await askForUrl(cher)).body.key;

    const response = await postItem(dionne, { ...blouse, photoOriginalKey: cherKey });

    expect(response.status).toBe(400);
  });

  it('Scenario: An invented key is refused', async () => {
    const cher = await register('cher');

    const response = await postItem(cher, { ...blouse, photoOriginalKey: 'items/mine/x.webp' });

    // `ownerOf` answers null for anything this API never issued, which fails the
    // comparison exactly as a stolen key does.
    expect(response.status).toBe(400);
  });

  it('Scenario: Your own key is accepted', async () => {
    const cher = await register('cher');
    const key = (await askForUrl(cher)).body.key;

    const response = await postItem(cher, { ...blouse, photoOriginalKey: key });

    expect(response.status).toBe(201);
  });
});

describe('Requirement: An item answers with a link to its photograph', () => {
  it("Scenario: The owner's item carries a link", async () => {
    const cher = await register('cher');
    const key = await uploadedPhoto(cher, 'the white blouse');
    const created = await postItem(cher, { ...blouse, photoOriginalKey: key });

    const response = await getItem(cher, created.body.id);

    expect(response.body.photoUrl).toContain('X-Amz-Signature');

    // The link is the whole point, so it is followed rather than merely matched.
    const image = await fetch(response.body.photoUrl);

    expect(await image.text()).toBe('the white blouse');
  });

  it('Scenario: An item without a photo says so', async () => {
    const cher = await register('cher');
    const created = await postItem(cher, blouse);

    const response = await getItem(cher, created.body.id);

    expect(response.body.photoUrl).toBeNull();
  });

  it('Scenario: A list carries links too', async () => {
    const cher = await register('cher');
    const key = await uploadedPhoto(cher);
    await postItem(cher, { ...blouse, photoOriginalKey: key });
    await postItem(cher, { slot: 'bottom', type: 'jeans', name: 'Blue jeans' });

    const response = await listItems(cher);

    const links = response.body.items.map((item: { photoUrl: string | null }) => item.photoUrl);

    expect(links.filter((link: string | null) => link !== null)).toHaveLength(1);
    expect(links.filter((link: string | null) => link === null)).toHaveLength(1);
  });
});
