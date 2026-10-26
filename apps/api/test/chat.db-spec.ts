import type { INestApplication } from '@nestjs/common';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { SendAck } from '../src/chat/chat.gateway.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createSocketApp } from './create-app.js';

let app: INestApplication<App>;
let prisma: PrismaService;
let port: number;

/** Every client a test opens, so `afterEach` can close all of them. */
const clients: Socket[] = [];

const PASSWORD = 'as if! whatever';

// One application for the file. Each test needs fresh accounts, not a fresh server,
// and binding a port per test made the next suite's first hook race its timeout.
beforeAll(async () => {
  ({ app, port } = await createSocketApp());
  prisma = app.get(PrismaService);
});

// Conversations are emptied explicitly: nothing cascades to them. A conversation
// holds no user column - membership does - so deleting everybody leaves the
// conversation behind with no members at all.
beforeEach(async () => {
  await prisma.user.deleteMany();
  await prisma.conversation.deleteMany();
});

// Clients first, application second. The other way round leaves `close` waiting on
// connections nobody is going to end, and the run hangs rather than failing.
afterEach(() => {
  for (const client of clients) {
    client.disconnect();
  }
  clients.length = 0;
});

afterAll(async () => {
  await app.close();
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

/**
 * Connects, and settles either way within two seconds.
 *
 * A socket that goes wrong says nothing at all, so without the timeout a broken
 * gateway would hang the run instead of failing it.
 */
function connect(token?: string): Promise<Socket> {
  const client = io(`http://localhost:${port}`, {
    auth: token === undefined ? {} : { token },
    transports: ['websocket'],
    reconnection: false,
  });
  clients.push(client);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('neither connected nor refused')), 2000);

    client.on('connect', () => {
      clearTimeout(timer);
      resolve(client);
    });
    client.on('connect_error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

describe('Requirement: A connection says who it is at the handshake', () => {
  it('Scenario: A valid token connects', async () => {
    const cher = await register('cher');

    const client = await connect(cher.token);

    expect(client.connected).toBe(true);
  });

  it('Scenario: No token is refused', async () => {
    await register('cher');

    await expect(connect()).rejects.toThrow(/unauthorized/);
  });

  it('Scenario: A tampered token is refused', async () => {
    const cher = await register('cher');
    // The payload left alone and the signature spoilt: this is the token the
    // server itself issued, with its last character changed.
    const tampered = cher.token.slice(0, -1) + (cher.token.at(-1) === 'a' ? 'b' : 'a');

    await expect(connect(tampered)).rejects.toThrow(/unauthorized/);
  });
});

/** Sends, and settles either way: the acknowledgement always arrives. */
function send(client: Socket, payload: unknown): Promise<SendAck> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('no acknowledgement')), 2000);

    client.emit('message:send', payload, (ack: SendAck) => {
      clearTimeout(timer);
      resolve(ack);
    });
  });
}

/** The next `message` this client is given, or a readable failure. */
function nextMessage(client: Socket): Promise<{ id: string; body: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('no message arrived')), 2000);

    client.once('message', (message: { id: string; body: string }) => {
      clearTimeout(timer);
      resolve(message);
    });
  });
}

async function befriend(a: Account, b: Account, aName: string, bName: string) {
  await request(app.getHttpServer())
    .post(`/friends/${bName}`)
    .set('Authorization', `Bearer ${a.token}`);
  await request(app.getHttpServer())
    .post(`/friends/${aName}/accept`)
    .set('Authorization', `Bearer ${b.token}`);
}

const MESSAGE_ID = '33333333-3333-4333-8333-333333333333';

describe('Requirement: A message reaches the other person live', () => {
  it('Scenario: The message arrives', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    const cherSocket = await connect(cher.token);
    const dionneSocket = await connect(dionne.token);

    const arriving = nextMessage(dionneSocket);
    await send(cherSocket, { id: MESSAGE_ID, to: 'dionne', body: 'as if!' });

    expect((await arriving).body).toBe('as if!');
  });

  it('Scenario: The sender is acknowledged', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    const cherSocket = await connect(cher.token);

    const ack = await send(cherSocket, { id: MESSAGE_ID, to: 'dionne', body: 'as if!' });

    expect(ack.ok).toBe(true);
    expect(ack.ok && ack.message.id).toBe(MESSAGE_ID);
    expect(ack.ok && ack.message.createdAt).toEqual(expect.any(String));
  });

  it('Scenario: A conversation that did not exist is reached anyway', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    // Both connect before any conversation exists, so neither socket could have
    // joined its room. The room is made by the message that follows.
    const cherSocket = await connect(cher.token);
    const dionneSocket = await connect(dionne.token);

    expect(await prisma.conversation.count()).toBe(0);

    const arriving = nextMessage(dionneSocket);
    await send(cherSocket, { id: MESSAGE_ID, to: 'dionne', body: 'the first word' });

    expect((await arriving).body).toBe('the first word');
  });
});

describe('Requirement: A message is stored once however often it is sent', () => {
  it('Scenario: The message is stored', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    const cherSocket = await connect(cher.token);

    await send(cherSocket, { id: MESSAGE_ID, to: 'dionne', body: 'as if!' });

    const stored = await prisma.message.findUniqueOrThrow({ where: { id: MESSAGE_ID } });

    expect(stored.body).toBe('as if!');
    expect(stored.senderId).toBe(cher.id);
  });

  it('Scenario: Sending the same message twice stores one', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    const cherSocket = await connect(cher.token);
    const payload = { id: MESSAGE_ID, to: 'dionne', body: 'as if!' };

    const first = await send(cherSocket, payload);
    const again = await send(cherSocket, payload);

    // Indistinguishable from the first, which is the point: a client whose
    // acknowledgement was lost cannot tell, and does not have to.
    expect(again).toEqual(first);
    expect(await prisma.message.count()).toBe(1);
  });
});

describe('Requirement: Only friends may send to each other', () => {
  it('Scenario: A stranger cannot send', async () => {
    const cher = await register('cher');
    await register('dionne');
    const cherSocket = await connect(cher.token);

    const ack = await send(cherSocket, { id: MESSAGE_ID, to: 'dionne', body: 'as if!' });

    expect(ack.ok).toBe(false);
    expect(await prisma.message.count()).toBe(0);
  });

  it('Scenario: Blocking stops messages', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    await request(app.getHttpServer())
      .post('/friends/cher/block')
      .set('Authorization', `Bearer ${dionne.token}`);
    const cherSocket = await connect(cher.token);

    const ack = await send(cherSocket, { id: MESSAGE_ID, to: 'dionne', body: 'as if!' });

    expect(ack.ok).toBe(false);
    // The same words a name nobody holds gets: a refusal that explained itself
    // would tell cher she has been blocked.
    expect(ack.ok === false && ack.error).toBe('No such person');
  });
});
