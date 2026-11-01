import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { uk } from '../src/i18n/uk';
import { getAccessToken } from '../src/platform/token-store';
import { signedIn } from './api-fixtures';
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
