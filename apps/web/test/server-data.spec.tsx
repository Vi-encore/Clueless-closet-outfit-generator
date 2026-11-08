import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { uk } from '../src/shared/i18n/uk';
import { aRelation, anItem, signedIn } from './api-fixtures';
import { renderApp } from './render-app';
import { API, server } from './server';

const dionne = {
  id: '00000000-0000-4000-8000-000000000002',
  email: 'dionne@example.com',
  username: 'dionne',
  displayName: 'Dionne Davenport',
};

const signInScreen = () => screen.findByRole('region', { name: uk.signIn.title });

/**
 * Whether a text was ever on the page from now on, and not only at the moment of asking:
 * a cached list can be shown for a single render before the API's answer replaces it.
 */
function watchFor(text: string) {
  let seen = false;
  const look = () => {
    seen ||= document.body.textContent?.includes(text) ?? false;
  };
  const observer = new MutationObserver(look);

  observer.observe(document.body, { subtree: true, childList: true, characterData: true });
  look();

  return () => {
    look();
    observer.disconnect();

    return seen;
  };
}

/**
 * Somebody else, who can sign in with the form once the first person has gone. The form
 * returns to wherever the first person was interrupted, which is the hardest case: the
 * very screen whose data is still remembered.
 */
async function signInAsDionne(person: ReturnType<typeof userEvent.setup>) {
  server.use(
    http.post(`${API}/auth/sign-in`, () => HttpResponse.json({ accessToken: 'dionnes-token' })),
    http.get(`${API}/auth/me`, () => HttpResponse.json(dionne)),
  );

  await person.type(await screen.findByLabelText(uk.signIn.email), dionne.email);
  await person.type(screen.getByLabelText(uk.signIn.password), 'whatever, as if');
  await person.click(screen.getByRole('button', { name: uk.signIn.submit }));
}

/** Each of a person's relation lists, with only their friends in it. */
function theirFriendsAre(...usernames: string[]) {
  server.use(
    http.get(`${API}/friends`, () => HttpResponse.json(usernames.map((name) => aRelation(name)))),
    http.get(`${API}/friends/requests`, () => HttpResponse.json([])),
    http.get(`${API}/friends/requests/sent`, () => HttpResponse.json([])),
    http.get(`${API}/friends/blocked`, () => HttpResponse.json([])),
  );
}

describe('Requirement: Signing out forgets what was loaded', () => {
  it('Scenario: The next person sees only their own', async () => {
    const person = userEvent.setup();
    signedIn();
    server.use(
      http.get(`${API}/items`, () =>
        HttpResponse.json({ items: [anItem({ name: 'Yellow plaid blazer' })], nextCursor: null }),
      ),
      http.post(`${API}/auth/sign-out`, () => new HttpResponse(null, { status: 204 })),
    );
    renderApp('/wardrobe');
    await screen.findByText('Yellow plaid blazer');

    await person.click(screen.getByRole('button', { name: uk.taskbar.signOut }));
    await signInScreen();
    const sawHers = watchFor('Yellow plaid blazer');
    server.use(
      http.get(`${API}/items`, () =>
        HttpResponse.json({
          items: [anItem({ id: '00000000-0000-4000-8000-0000000000bb', name: 'Red beret' })],
          nextCursor: null,
        }),
      ),
    );
    await signInAsDionne(person);

    expect(await screen.findByText('Red beret')).toBeInTheDocument();
    expect(sawHers()).toBe(false);
  });

  it('Scenario: A lost session forgets too', async () => {
    const person = userEvent.setup();
    signedIn();
    theirFriendsAre('murray');
    renderApp('/friends');
    await screen.findByText('murray');

    // The next request is refused, and so is the renewal it asks for.
    server.use(
      http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
      http.get(`${API}/items`, () => new HttpResponse(null, { status: 401 })),
    );
    await person.click(screen.getByRole('button', { name: uk.window.back }));
    await person.click(await screen.findByRole('link', { name: uk.wardrobe.title }));
    await signInScreen();
    const sawHis = watchFor('murray');
    theirFriendsAre('travis');
    server.use(http.get(`${API}/items`, () => HttpResponse.json({ items: [], nextCursor: null })));
    await signInAsDionne(person);
    await screen.findByText(uk.wardrobe.empty);
    await person.click(screen.getByRole('button', { name: uk.window.back }));
    await person.click(await screen.findByRole('link', { name: uk.friends.title }));

    expect(await screen.findByText('travis')).toBeInTheDocument();
    expect(sawHis()).toBe(false);
  });
});

describe('Requirement: A failed load says so at once', () => {
  it('Scenario: One refusal, one answer on screen', async () => {
    let asked = 0;
    signedIn();
    server.use(
      http.get(`${API}/items`, () => {
        asked += 1;

        return new HttpResponse(null, { status: 500 });
      }),
    );

    renderApp('/wardrobe');

    expect(await screen.findByRole('alert')).toHaveTextContent(uk.errors.unavailable);
    expect(asked).toBe(1);
  });

  it('Scenario: A missing item is not found at once', async () => {
    let asked = 0;
    signedIn();
    server.use(
      http.get(`${API}/items/:id`, () => {
        asked += 1;

        return new HttpResponse(null, { status: 404 });
      }),
    );

    renderApp('/wardrobe/00000000-0000-4000-8000-0000000000cc');

    expect(await screen.findByRole('region', { name: uk.notFound.title })).toBeInTheDocument();
    expect(asked).toBe(1);
  });
});
