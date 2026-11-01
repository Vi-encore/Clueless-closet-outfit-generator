import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Conversation, Message } from '../src/api/api.interfaces';
import { uk } from '../src/i18n/uk';
import { getAccessToken } from '../src/platform/token-store';
import { aConversation, aRelation, signedIn } from './api-fixtures';
import { renderApp } from './render-app';
import { API, server } from './server';
import { socketServer } from './socket-server';

describe('Requirement: The connection lives with the session', () => {
  it('Scenario: Signing in connects', async () => {
    signedIn();

    renderApp('/');

    await expect.poll(() => socketServer.connected).toBe(1);
    expect(socketServer.tokens).toContain('a-token');
  });

  it('Scenario: Signing out disconnects', async () => {
    const person = userEvent.setup();
    signedIn();
    server.use(http.post(`${API}/auth/sign-out`, () => new HttpResponse(null, { status: 204 })));
    renderApp('/');
    await expect.poll(() => socketServer.connected).toBe(1);

    await person.click(await screen.findByRole('button', { name: uk.taskbar.signOut }));

    await expect.poll(() => socketServer.connected).toBe(0);
  });

  it('Scenario: An expired token is renewed', async () => {
    const issued = ['expired-token', 'fresh-token'];
    signedIn();
    server.use(
      http.post(`${API}/auth/refresh`, () =>
        HttpResponse.json({ accessToken: issued.shift() ?? 'too-many-renewals' }),
      ),
    );
    socketServer.accepts = (token) => token === 'fresh-token';

    renderApp('/');

    await expect.poll(() => socketServer.connected).toBe(1);
    expect(socketServer.tokens).toEqual(['expired-token', 'fresh-token']);
    expect(getAccessToken()).toBe('fresh-token');
  });
});

describe('Requirement: Conversations are listed by the last word', () => {
  function theApiHolds(...conversations: Conversation[]) {
    server.use(http.get(`${API}/conversations`, () => HttpResponse.json(conversations)));
  }

  it('Scenario: A conversation shows what is unread', async () => {
    signedIn();
    theApiHolds(aConversation('dionne', 2));

    renderApp('/chat');

    const link = await screen.findByRole('link', { name: /dionne/ });
    expect(within(link).getByLabelText(uk.chat.unread(2))).toHaveTextContent('2');
  });

  it('Scenario: The desktop shows the total', async () => {
    signedIn();
    theApiHolds(aConversation('dionne', 2), aConversation('tai', 1));

    renderApp('/');

    const shortcut = await screen.findByRole('link', { name: new RegExp(uk.chat.title) });
    expect(await within(shortcut).findByLabelText(uk.chat.unread(3))).toBeInTheDocument();
  });

  it('Scenario: No conversations says so', async () => {
    signedIn();

    renderApp('/chat');

    expect(await screen.findByText(uk.chat.none)).toBeInTheDocument();
  });

  it('Scenario: A friend leads to a conversation', async () => {
    const person = userEvent.setup();
    signedIn();
    server.use(
      http.get(`${API}/friends`, () => HttpResponse.json([aRelation('dionne')])),
      http.get(`${API}/friends/requests`, () => HttpResponse.json([])),
      http.get(`${API}/friends/requests/sent`, () => HttpResponse.json([])),
      http.get(`${API}/friends/blocked`, () => HttpResponse.json([])),
    );
    renderApp('/friends');

    await person.click(await screen.findByRole('link', { name: `${uk.chat.write}: dionne` }));

    expect(await screen.findByRole('region', { name: 'dionne' })).toBeInTheDocument();
  });

  it('Scenario: A message arriving moves the list', async () => {
    let unread = 0;
    signedIn();
    server.use(
      http.get(`${API}/conversations`, () => HttpResponse.json([aConversation('dionne', unread)])),
    );
    renderApp('/chat');
    await screen.findByRole('link', { name: /dionne/ });
    await expect.poll(() => socketServer.connected).toBe(1);

    unread = 1;
    socketServer.emit('message', { id: 'a-message' });

    expect(await screen.findByLabelText(uk.chat.unread(1))).toBeInTheDocument();
  });
});

const DIONNE = 'dionne-id';
const ME = '00000000-0000-4000-8000-000000000001';

function aMessage(id: string, body: string, minute: number, senderId = DIONNE): Message {
  return {
    id,
    conversationId: 'conversation',
    senderId,
    body,
    createdAt: `2026-11-01T12:${String(minute).padStart(2, '0')}:00.000Z`,
  };
}

/** A conversation with `dionne`: newest first, as the API answers, and marked read freely. */
function aConversationHolds(...messages: Message[]) {
  const read = { times: 0 };

  signedIn();
  server.use(
    http.get(`${API}/conversations/with/dionne/messages`, () =>
      HttpResponse.json({ items: messages, nextCursor: null }),
    ),
    http.post(`${API}/conversations/with/dionne/read`, () => {
      read.times += 1;

      return new HttpResponse(null, { status: 204 });
    }),
  );

  return read;
}

const bubbles = () =>
  within(screen.getByRole('list', { name: 'dionne' }))
    .queryAllByRole('listitem')
    .map((item) => item.textContent);

describe('Requirement: A conversation is read a page at a time', () => {
  it('Scenario: Messages are in order', async () => {
    aConversationHolds(
      aMessage('c', 'third', 3),
      aMessage('b', 'second', 2),
      aMessage('a', 'first', 1),
    );

    renderApp('/chat/dionne');

    await screen.findByText('third');
    expect(bubbles()).toEqual(['first', 'second', 'third']);
  });

  it('Scenario: Earlier messages can be asked for', async () => {
    const person = userEvent.setup();
    aConversationHolds();
    server.use(
      http.get(`${API}/conversations/with/dionne/messages`, ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('cursor') === 'b'
            ? { items: [aMessage('a', 'first', 1)], nextCursor: null }
            : { items: [aMessage('b', 'second', 2)], nextCursor: 'b' },
        ),
      ),
    );
    renderApp('/chat/dionne');

    await person.click(await screen.findByRole('button', { name: uk.chat.earlier }));

    await screen.findByText('first');
    expect(bubbles()).toEqual(['first', 'second']);
    expect(screen.queryByRole('button', { name: uk.chat.earlier })).not.toBeInTheDocument();
  });

  it('Scenario: Opening marks it read', async () => {
    const read = aConversationHolds(aMessage('a', 'first', 1));

    renderApp('/chat/dionne');

    await expect.poll(() => read.times).toBeGreaterThan(0);
  });
});

describe('Requirement: A message appears at once and settles when acknowledged', () => {
  type Ack = (answer: unknown) => void;

  /** Keeps what reaches the gateway, unanswered, for the test to answer by hand. */
  function theGatewayHolds() {
    const held: Array<{ payload: { id: string; body: string }; ack: Ack }> = [];

    socketServer.onConnection = (socket) => {
      socket.on('message:send', (payload: { id: string; body: string }, ack: Ack) => {
        held.push({ payload, ack });
      });
    };

    return held;
  }

  async function write(person: ReturnType<typeof userEvent.setup>, body: string) {
    await person.type(await screen.findByLabelText(uk.chat.message), body);
    await person.click(screen.getByRole('button', { name: uk.chat.send }));
  }

  async function connected() {
    await expect.poll(() => socketServer.connected).toBe(1);
  }

  it('Scenario: A message appears at once', async () => {
    const person = userEvent.setup();
    theGatewayHolds();
    aConversationHolds();
    renderApp('/chat/dionne');
    await connected();

    await write(person, 'as if!');

    expect(await screen.findByText(/as if!/)).toHaveTextContent(uk.chat.sending);
    expect(screen.getByLabelText(uk.chat.message)).toHaveValue('');
  });

  it('Scenario: The acknowledgement settles it', async () => {
    const person = userEvent.setup();
    const held = theGatewayHolds();
    aConversationHolds();
    renderApp('/chat/dionne');
    await connected();
    await write(person, 'as if!');
    await expect.poll(() => held.length).toBe(1);

    const [{ payload, ack }] = held as [(typeof held)[number]];
    ack({ ok: true, message: aMessage(payload.id, 'as if!', 5, ME) });

    await expect.poll(() => screen.queryByText(uk.chat.sending)).toBeNull();
    expect(bubbles()).toEqual(['as if!']);
  });

  it('Scenario: A refused message can be tried again', async () => {
    const person = userEvent.setup();
    const held = theGatewayHolds();
    aConversationHolds();
    renderApp('/chat/dionne');
    await connected();
    await write(person, 'as if!');
    await expect.poll(() => held.length).toBe(1);

    held[0]?.ack({ ok: false, error: 'No such person' });
    await person.click(await screen.findByRole('button', { name: uk.chat.tryAgain }));

    await expect.poll(() => held.length).toBe(2);
    expect(held[1]?.payload.id).toBe(held[0]?.payload.id);
  });
});
