import type { INestApplication } from '@nestjs/common';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createSocketApp } from './create-app.js';
import type { Account, Listener } from './test.interfaces.js';

let app: INestApplication<App>;
let prisma: PrismaService;
let port: number;

const clients: Socket[] = [];

const PASSWORD = 'as if! whatever';

/** Long enough for an event sent with the answer to have arrived, if one was sent. */
const QUIET = 300;

beforeAll(async () => {
  ({ app, port } = await createSocketApp());
  prisma = app.get(PrismaService);
});

beforeEach(async () => {
  await prisma.user.deleteMany();
});

afterEach(() => {
  for (const client of clients) {
    client.disconnect();
  }
  clients.length = 0;
});

afterAll(async () => {
  await app.close();
});

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

/** A person with a live connection, and how many times it has heard `friends:changed`. */
async function online(username: string): Promise<Listener> {
  const account = await register(username);
  // An address rather than `localhost`, so that connecting looks nothing up.
  const client = io(`http://127.0.0.1:${port}`, {
    auth: { token: account.token },
    transports: ['websocket'],
    reconnection: false,
  });
  clients.push(client);

  const listener: Listener = { ...account, heard: 0 };
  client.on('friends:changed', () => {
    listener.heard += 1;
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('neither connected nor refused')), 2000);
    client.on('connect', () => {
      clearTimeout(timer);
      resolve();
    });
  });

  return listener;
}

function as(person: Account) {
  const server = app.getHttpServer();
  const auth = `Bearer ${person.token}`;

  return {
    ask: (username: string) =>
      request(server).post(`/friends/${username}`).set('Authorization', auth),
    accept: (username: string) =>
      request(server).post(`/friends/${username}/accept`).set('Authorization', auth),
    remove: (username: string) =>
      request(server).delete(`/friends/${username}`).set('Authorization', auth),
    block: (username: string) =>
      request(server).post(`/friends/${username}/block`).set('Authorization', auth),
  };
}

const quiet = () => new Promise((resolve) => setTimeout(resolve, QUIET));

describe('Requirement: A change to a relation is announced to the people it changes', () => {
  it('Scenario: A request reaches the person asked', async () => {
    const cher = await online('cher');
    const dionne = await online('dionne');

    await as(cher).ask('dionne').expect(201);

    await expect.poll(() => [cher.heard, dionne.heard]).toEqual([1, 1]);
  });

  it('Scenario: Accepting reaches the person who asked', async () => {
    const cher = await online('cher');
    const dionne = await online('dionne');
    await as(cher).ask('dionne').expect(201);
    await expect.poll(() => [cher.heard, dionne.heard]).toEqual([1, 1]);

    await as(dionne).accept('cher').expect(200);

    await expect.poll(() => [cher.heard, dionne.heard]).toEqual([2, 2]);
  });

  it('Scenario: Unfriending reaches both', async () => {
    const cher = await online('cher');
    const dionne = await online('dionne');
    await as(cher).ask('dionne').expect(201);
    await as(dionne).accept('cher').expect(200);
    await expect.poll(() => [cher.heard, dionne.heard]).toEqual([2, 2]);

    await as(cher).remove('dionne').expect(200);

    await expect.poll(() => [cher.heard, dionne.heard]).toEqual([3, 3]);
  });

  it('Scenario: Blocking a stranger reaches only the blocker', async () => {
    const cher = await online('cher');
    const elton = await online('elton');

    await as(cher).block('elton').expect(200);

    await expect.poll(() => cher.heard).toBe(1);
    await quiet();
    expect(elton.heard).toBe(0);
  });

  it('Scenario: Lifting a block reaches only the person lifting it', async () => {
    const cher = await online('cher');
    const elton = await online('elton');
    await as(cher).block('elton').expect(200);
    await expect.poll(() => cher.heard).toBe(1);

    await as(cher).remove('elton').expect(200);

    await expect.poll(() => cher.heard).toBe(2);
    await quiet();
    expect(elton.heard).toBe(0);
  });
});
