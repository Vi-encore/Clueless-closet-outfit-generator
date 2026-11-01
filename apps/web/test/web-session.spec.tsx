import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from '../src/api/client';
import { uk } from '../src/i18n/uk';
import { getAccessToken, setAccessToken } from '../src/platform/token-store';
import { renderApp } from './render-app';
import { API, server } from './server';

const cher = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'cher@example.com',
  username: 'cher',
  displayName: 'Cher Horowitz',
};

const password = 'as if! whatever';

const SIGN_IN_ANSWER = { accessToken: 'token-from-sign-in' };

/** An API that knows Cher, whichever way she arrives. */
function apiKnowsCher() {
  server.use(
    http.post(`${API}/auth/sign-in`, () => HttpResponse.json(SIGN_IN_ANSWER)),
    http.get(`${API}/auth/me`, () => HttpResponse.json(cher)),
  );
}

/** The refresh cookie still works: `onCall` sees each request for the assertions. */
function refreshWorks(onCall: (request: Request) => void = () => {}) {
  server.use(
    http.post(`${API}/auth/refresh`, ({ request: refresh }) => {
      onCall(refresh);

      return HttpResponse.json({ accessToken: 'renewed-token' });
    }),
  );
}

async function signIn(person: ReturnType<typeof userEvent.setup>) {
  await person.type(await screen.findByLabelText(uk.signIn.email), cher.email);
  await person.type(screen.getByLabelText(uk.signIn.password), password);
  await person.click(screen.getByRole('button', { name: uk.signIn.submit }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

const desktop = () => screen.findByRole('region', { name: uk.desktop.title });
const signInScreen = () => screen.findByRole('region', { name: uk.signIn.title });

describe('Requirement: A session starts and ends on the client', () => {
  it('Scenario: The right password gets in', async () => {
    apiKnowsCher();
    renderApp('/sign-in');

    await signIn(userEvent.setup());

    expect(await desktop()).toBeInTheDocument();
  });

  it('Scenario: The wrong password says so', async () => {
    server.use(http.post(`${API}/auth/sign-in`, () => new HttpResponse(null, { status: 401 })));
    renderApp('/sign-in');

    await signIn(userEvent.setup());

    expect(await screen.findByRole('alert')).toHaveTextContent(uk.signIn.refused);
    expect(screen.queryByRole('region', { name: uk.desktop.title })).not.toBeInTheDocument();
  });

  async function register(person: ReturnType<typeof userEvent.setup>) {
    await person.type(await screen.findByLabelText(uk.signUp.email), cher.email);
    await person.type(screen.getByLabelText(uk.signUp.username), cher.username);
    await person.type(screen.getByLabelText(uk.signUp.password), password);
    await person.click(screen.getByRole('button', { name: uk.signUp.submit }));
  }

  it('Scenario: A new account gets in', async () => {
    apiKnowsCher();
    server.use(http.post(`${API}/auth/sign-up`, () => HttpResponse.json(cher, { status: 201 })));
    renderApp('/sign-up');

    await register(userEvent.setup());

    expect(await desktop()).toBeInTheDocument();
  });

  it('Scenario: A taken name says so', async () => {
    server.use(http.post(`${API}/auth/sign-up`, () => new HttpResponse(null, { status: 409 })));
    renderApp('/sign-up');

    await register(userEvent.setup());

    expect(await screen.findByRole('alert')).toHaveTextContent(uk.signUp.taken);
    expect(screen.queryByRole('region', { name: uk.desktop.title })).not.toBeInTheDocument();
  });

  it('Scenario: The token is not written down', async () => {
    apiKnowsCher();
    renderApp('/sign-in');

    await signIn(userEvent.setup());
    await desktop();

    expect(getAccessToken()).toBe(SIGN_IN_ANSWER.accessToken);
    expect(window.localStorage).toHaveLength(0);
    expect(window.sessionStorage).toHaveLength(0);
    expect(document.cookie).toBe('');
  });

  it('Scenario: Signing out tells the API and forgets the token', async () => {
    const person = userEvent.setup();
    let asked = 0;
    apiKnowsCher();
    server.use(
      http.post(`${API}/auth/sign-out`, () => {
        asked += 1;

        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp('/sign-in');
    await signIn(person);
    await desktop();

    await person.click(screen.getByRole('button', { name: uk.taskbar.signOut }));

    expect(await signInScreen()).toBeInTheDocument();
    expect(asked).toBe(1);
    expect(getAccessToken()).toBeNull();
  });
});

describe('Requirement: A reload does not ask for the password again', () => {
  it('Scenario: The session comes back', async () => {
    const sent = vi.spyOn(globalThis, 'fetch');
    apiKnowsCher();
    refreshWorks();

    renderApp('/');

    expect(await desktop()).toBeInTheDocument();
    // All a test here can say about the cookie, since MSW 3 keeps no cookies in Node:
    // that the browser is told to send it. The API's own tests prove the rest. Read from
    // the call rather than in a handler, where MSW's copy of the request has lost it.
    expect(sent).toHaveBeenCalledWith(
      `${API}/auth/refresh`,
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('Scenario: A refusal asks for the password', async () => {
    renderApp('/');

    expect(await signInScreen()).toBeInTheDocument();
  });

  it('Scenario: Nothing is decided while it is being asked', async () => {
    const { promise: theAnswer, resolve: answer } = Promise.withResolvers<void>();
    server.use(
      http.post(`${API}/auth/refresh`, async () => {
        await theAnswer;

        return new HttpResponse(null, { status: 401 });
      }),
    );

    // Both ends, because each has its own guard: `/` must not bounce to the form, and a
    // reload on the form itself must not flash it at somebody who is signed in.
    for (const path of ['/', '/sign-in']) {
      const { unmount } = renderApp(path);

      // The taskbar arriving shows the application has rendered, so what is missing is
      // missing because nothing was decided, not because nothing has drawn yet.
      await screen.findByRole('navigation', { name: uk.taskbar.label });
      expect(screen.queryByRole('region', { name: uk.signIn.title })).not.toBeInTheDocument();
      expect(screen.queryByRole('region', { name: uk.desktop.title })).not.toBeInTheDocument();

      if (path === '/') {
        unmount();
      }
    }

    // Answered rather than left hanging: a renewal under way is shared, in a module, so
    // one that never finished would still be what every later test was waiting on.
    answer();
    expect(await signInScreen()).toBeInTheDocument();
  });
});

describe('Requirement: An expired token is renewed out of sight', () => {
  /** Answers only to the renewed token, the way the API treats an expired one. */
  function apiWantsARenewedToken(onCall: () => void = () => {}) {
    server.use(
      http.get(`${API}/wardrobe`, ({ request: incoming }) => {
        onCall();

        return incoming.headers.get('Authorization') === 'Bearer renewed-token'
          ? HttpResponse.json({ items: [] })
          : new HttpResponse(null, { status: 401 });
      }),
    );
  }

  it('Scenario: The request succeeds after a renewal', async () => {
    let sent = 0;
    setAccessToken('expired-token');
    refreshWorks();
    apiWantsARenewedToken(() => {
      sent += 1;
    });

    await expect(request('/wardrobe')).resolves.toEqual({ items: [] });

    expect(sent).toBe(2);
  });

  it('Scenario: A refused renewal ends the session', async () => {
    apiKnowsCher();
    renderApp('/sign-in');
    await signIn(userEvent.setup());
    await desktop();
    apiWantsARenewedToken();
    server.use(http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 401 })));

    await act(async () => {
      await expect(request('/wardrobe')).rejects.toMatchObject({ status: 401 });
    });

    expect(await signInScreen()).toBeInTheDocument();
    expect(getAccessToken()).toBeNull();
  });

  it('Scenario: Several waiting requests cause one renewal', async () => {
    let renewals = 0;
    setAccessToken('expired-token');
    refreshWorks(() => {
      renewals += 1;
    });
    apiWantsARenewedToken();

    await Promise.all([request('/wardrobe'), request('/wardrobe'), request('/wardrobe')]);

    expect(renewals).toBe(1);
  });
});
