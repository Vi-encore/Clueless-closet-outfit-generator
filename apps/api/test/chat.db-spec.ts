import type { INestApplication } from '@nestjs/common';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createSocketApp } from './create-app.js';
import type { SendAck } from '../src/chat/chat.interfaces.js';
import type { Account, ReceivedMessage, WithUsername } from './test.interfaces.js';

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
function nextMessage(client: Socket): Promise<ReceivedMessage> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('no message arrived')), 2000);

    client.once('message', (message: ReceivedMessage) => {
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

function history(account: Account, username: string, query = '') {
  return request(app.getHttpServer())
    .get(`/conversations/with/${username}/messages${query}`)
    .set('Authorization', `Bearer ${account.token}`);
}

function conversations(account: Account) {
  return request(app.getHttpServer())
    .get('/conversations')
    .set('Authorization', `Bearer ${account.token}`);
}

/** Three messages, sent one after another so their order is settled. */
async function threeMessages(from: Socket, to: string) {
  for (const [index, body] of ['first', 'second', 'third'].entries()) {
    await send(from, { id: `4444444${index}-4444-4444-8444-444444444444`, to, body });
  }
}

describe('Requirement: History is read a page at a time', () => {
  it('Scenario: Messages come back newest first', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    await threeMessages(await connect(cher.token), 'dionne');

    const response = await history(cher, 'dionne');

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.items[0].body).toBe('third');
  });

  it('Scenario: History pages', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    await threeMessages(await connect(cher.token), 'dionne');

    const first = await history(cher, 'dionne', '?limit=2');

    expect(first.body.items).toHaveLength(2);
    expect(first.body.nextCursor).toEqual(expect.any(String));

    const second = await history(cher, 'dionne', `?limit=2&cursor=${first.body.nextCursor}`);

    expect(second.body.items).toHaveLength(1);
    expect(second.body.items[0].body).toBe('first');
  });

  it('Scenario: A stranger reads nothing', async () => {
    const cher = await register('cher');
    await register('dionne');

    const response = await history(cher, 'dionne');

    // 404 rather than an empty page: an empty page would say the person exists.
    expect(response.status).toBe(404);
  });
});

describe('Requirement: Conversations are listed', () => {
  it('Scenario: A conversation appears once there is a message', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    await send(await connect(cher.token), { id: MESSAGE_ID, to: 'dionne', body: 'as if!' });

    const response = await conversations(cher);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].user.username).toBe('dionne');
  });

  it('Scenario: A friendship alone is not a conversation', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');

    const response = await conversations(cher);

    expect(response.body).toEqual([]);
  });
});

describe('Requirement: Messages missed while away are fetched', () => {
  it('Scenario: Only what is newer comes back', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    await threeMessages(await connect(cher.token), 'dionne');

    const all = await history(dionne, 'cher');
    const oldest = all.body.items[2];

    const response = await history(dionne, 'cher', `?after=${oldest.id}`);

    expect(response.body.items).toHaveLength(2);
    // Oldest first, so a client appends what it is given rather than reordering.
    expect(response.body.items[0].body).toBe('second');
    expect(response.body.items[1].body).toBe('third');
  });

  it('Scenario: Nothing was missed', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    await threeMessages(await connect(cher.token), 'dionne');

    const all = await history(dionne, 'cher');
    const newest = all.body.items[0];

    const response = await history(dionne, 'cher', `?after=${newest.id}`);

    expect(response.body.items).toEqual([]);
    expect(response.body.nextCursor).toBeNull();
  });
});

describe('Requirement: A conversation records when it was last spoken in', () => {
  it('Scenario: Storing a message records the moment', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    const socket = await connect(cher.token);

    const ack = await send(socket, { id: MESSAGE_ID, to: 'dionne', body: 'as if!' });

    const conversation = await prisma.conversation.findFirstOrThrow();

    // Exactly the message's own moment, not a second `new Date()` beside it.
    expect(conversation.lastMessageAt?.toISOString()).toBe(ack.ok && ack.message.createdAt);
  });

  it('Scenario: A later message replaces the moment', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    const socket = await connect(cher.token);
    await send(socket, { id: MESSAGE_ID, to: 'dionne', body: 'first' });

    const second = await send(socket, {
      id: '55555555-5555-4555-8555-555555555555',
      to: 'dionne',
      body: 'second',
    });

    const conversation = await prisma.conversation.findFirstOrThrow();

    expect(conversation.lastMessageAt?.toISOString()).toBe(second.ok && second.message.createdAt);
  });
});

describe('Requirement: Conversations are listed by when they were last spoken in', () => {
  it('Scenario: The most recent conversation is first', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    const tai = await register('tai');
    await befriend(cher, dionne, 'cher', 'dionne');
    await befriend(cher, tai, 'cher', 'tai');
    const socket = await connect(cher.token);

    await send(socket, { id: MESSAGE_ID, to: 'dionne', body: 'to dionne' });
    await send(socket, {
      id: '66666666-6666-4666-8666-666666666666',
      to: 'tai',
      body: 'to tai',
    });

    const response = await conversations(cher);

    expect(response.body.map((entry: WithUsername) => entry.user.username)).toEqual([
      'tai',
      'dionne',
    ]);
  });

  it('Scenario: A new message moves a conversation up', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    const tai = await register('tai');
    await befriend(cher, dionne, 'cher', 'dionne');
    await befriend(cher, tai, 'cher', 'tai');
    const cherSocket = await connect(cher.token);
    await send(cherSocket, { id: MESSAGE_ID, to: 'dionne', body: 'to dionne' });
    await send(cherSocket, {
      id: '66666666-6666-4666-8666-666666666666',
      to: 'tai',
      body: 'to tai',
    });

    const dionneSocket = await connect(dionne.token);
    await send(dionneSocket, {
      id: '77777777-7777-4777-8777-777777777777',
      to: 'cher',
      body: 'back to cher',
    });

    const response = await conversations(cher);

    expect(response.body[0].user.username).toBe('dionne');
  });
});

describe('Unread messages', () => {
  const FIRST = '44444444-4444-4444-8444-444444444441';
  const SECOND = '44444444-4444-4444-8444-444444444442';
  const THIRD = '44444444-4444-4444-8444-444444444443';

  async function friends() {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');

    return {
      cher,
      dionne,
      cherSocket: await connect(cher.token),
      dionneSocket: await connect(dionne.token),
    };
  }

  function markRead(account: Account, username: string) {
    return request(app.getHttpServer())
      .post(`/conversations/with/${username}/read`)
      .set('Authorization', `Bearer ${account.token}`);
  }

  async function unreadFor(account: Account): Promise<number> {
    return (await conversations(account)).body[0].unread;
  }

  describe('Requirement: Unread messages are counted', () => {
    it('Scenario: New messages are unread', async () => {
      const { cher, dionneSocket } = await friends();
      await send(dionneSocket, { id: FIRST, to: 'cher', body: 'one' });
      await send(dionneSocket, { id: SECOND, to: 'cher', body: 'two' });

      expect(await unreadFor(cher)).toBe(2);
    });

    it('Scenario: Your own messages are not unread', async () => {
      const { cher, cherSocket } = await friends();
      await send(cherSocket, { id: FIRST, to: 'dionne', body: 'one' });

      expect(await unreadFor(cher)).toBe(0);
    });
  });

  describe('Requirement: A conversation can be marked as read', () => {
    it('Scenario: Reading clears the count', async () => {
      const { cher, dionneSocket } = await friends();
      await send(dionneSocket, { id: FIRST, to: 'cher', body: 'one' });

      const response = await markRead(cher, 'dionne');

      expect(response.status).toBe(204);
      expect(await unreadFor(cher)).toBe(0);
    });

    it('Scenario: A later message is unread again', async () => {
      const { cher, dionneSocket } = await friends();
      await send(dionneSocket, { id: FIRST, to: 'cher', body: 'one' });
      await markRead(cher, 'dionne');

      // A millisecond apart would be one moment to a timestamp.
      await new Promise((resolve) => setTimeout(resolve, 5));
      await send(dionneSocket, { id: SECOND, to: 'cher', body: 'two' });

      expect(await unreadFor(cher)).toBe(1);
    });

    it("Scenario: Reading is one person's", async () => {
      const { cher, dionne, cherSocket, dionneSocket } = await friends();
      await send(dionneSocket, { id: FIRST, to: 'cher', body: 'one' });
      await send(cherSocket, { id: THIRD, to: 'dionne', body: 'three' });

      await markRead(cher, 'dionne');

      expect(await unreadFor(dionne)).toBe(1);
    });

    it('Scenario: A stranger marks nothing', async () => {
      const cher = await register('cher');
      await register('dionne');

      const response = await markRead(cher, 'dionne');

      expect(response.status).toBe(404);
    });
  });
});

describe('Requirement: Typing reaches a friend and goes no further', () => {
  it('Scenario: A friend sees it', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    const cherSocket = await connect(cher.token);
    const dionneSocket = await connect(dionne.token);
    const told = new Promise((resolve) => dionneSocket.once('typing', resolve));

    cherSocket.emit('typing', { to: 'dionne' });

    expect(await told).toEqual({ username: 'cher' });
  });

  it('Scenario: A stranger hears nothing', async () => {
    const cher = await register('cher');
    const dionne = await register('dionne');
    const cherSocket = await connect(cher.token);
    const dionneSocket = await connect(dionne.token);
    let told = false;
    dionneSocket.once('typing', () => {
      told = true;
    });

    cherSocket.emit('typing', { to: 'dionne' });

    // A round trip through the gateway, so that anything it was going to relay has gone.
    await send(cherSocket, { id: 'not a uuid' });
    expect(told).toBe(false);
  });
});

describe('Requirement: A conversation stays with whoever blocked', () => {
  const BLOCK_MESSAGE = '55555555-5555-4555-8555-555555555555';

  async function blockedAfterTalking() {
    const cher = await register('cher');
    const dionne = await register('dionne');
    await befriend(cher, dionne, 'cher', 'dionne');
    await send(await connect(cher.token), { id: BLOCK_MESSAGE, to: 'dionne', body: 'as if!' });
    await request(app.getHttpServer())
      .post('/friends/dionne/block')
      .set('Authorization', `Bearer ${cher.token}`);

    return { cher, dionne };
  }

  it('Scenario: The person who blocked can still read it', async () => {
    const { cher } = await blockedAfterTalking();

    const response = await history(cher, 'dionne');

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
  });

  it('Scenario: The person blocked reads nothing', async () => {
    const { dionne } = await blockedAfterTalking();

    const response = await history(dionne, 'cher');

    expect(response.status).toBe(404);
  });

  it('Scenario: Nobody can write in it', async () => {
    const { cher } = await blockedAfterTalking();

    const ack = await send(await connect(cher.token), {
      id: '55555555-5555-4555-8555-555555555556',
      to: 'dionne',
      body: 'and another thing',
    });

    expect(ack.ok).toBe(false);
  });
});
