import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Conversation } from '../src/api/api.interfaces';
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
