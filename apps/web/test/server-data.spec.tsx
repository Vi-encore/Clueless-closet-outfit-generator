import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { uk } from '../src/shared/i18n/uk';
import { aConversation, aRelation, anItem, signedIn } from './api-fixtures';
import { renderApp } from './render-app';
import { API, server } from './server';

const dionne = {
  id: '00000000-0000-4000-8000-000000000002',
  email: 'dionne@example.com',
  username: 'dionne',
  displayName: 'Dionne Davenport',
};

const signInScreen = () => screen.findByRole('region', { name: uk.signIn.title });
const wardrobe = () => screen.findByRole('region', { name: uk.wardrobe.title });

const blazer = anItem({ id: 'blazer', name: 'Blazer', visibility: 'private' });
const loafers = anItem({ id: 'loafers', slot: 'shoes', type: 'loafers', name: 'Loafers' });
const blouse = anItem({ id: 'blouse', slot: 'top', type: 'blouse', name: 'Blouse' });

/** The wardrobe's list, answered at once the first time and only when let after that. */
function theWardrobeAnswersOnceThenWaits(first: object[], later: object[]) {
  const { promise: mayAnswer, resolve: letAnswer } = Promise.withResolvers<void>();
  let asked = 0;

  server.use(
    http.get(`${API}/items`, async () => {
      asked += 1;

      if (asked > 1) {
        await mayAnswer;
      }

      return HttpResponse.json({ items: asked > 1 ? later : first, nextCursor: null });
    }),
  );

  return { letAnswer, asked: () => asked };
}

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

describe('Requirement: A screen opened again shows what it last had', () => {
  it('Scenario: The wardrobe comes back at once', async () => {
    const person = userEvent.setup();
    signedIn();
    const api = theWardrobeAnswersOnceThenWaits([blazer], [blazer]);
    renderApp('/wardrobe');
    await screen.findByText('Blazer');
    await person.click(screen.getByRole('button', { name: uk.window.back }));

    await person.click(await screen.findByRole('link', { name: uk.wardrobe.title }));

    await wardrobe();
    expect(screen.getByText('Blazer')).toBeInTheDocument();
    // And it asked again behind what it shows.
    await expect.poll(api.asked).toBe(2);
    api.letAnswer();
  });

  it('Scenario: A newer answer replaces it', async () => {
    const person = userEvent.setup();
    const { promise: mayAnswer, resolve: letAnswer } = Promise.withResolvers<void>();
    let asked = 0;
    signedIn();
    theirFriendsAre();
    server.use(
      http.get(`${API}/friends`, async () => {
        asked += 1;

        if (asked > 1) {
          await mayAnswer;
        }

        const friends = asked > 1 ? ['murray', 'travis'] : ['murray'];

        return HttpResponse.json(friends.map((name) => aRelation(name)));
      }),
    );
    renderApp('/friends');
    await screen.findByText('murray');
    await person.click(screen.getByRole('button', { name: uk.window.back }));

    await person.click(await screen.findByRole('link', { name: uk.friends.title }));

    // What was there before, at once, while the API is asked again.
    await screen.findByRole('region', { name: uk.friends.title });
    expect(screen.getByText('murray')).toBeInTheDocument();
    expect(screen.queryByText('travis')).not.toBeInTheDocument();
    letAnswer();
    expect(await screen.findByText('travis')).toBeInTheDocument();
  });

  it('Scenario: Another slot is its own list', async () => {
    const person = userEvent.setup();
    const { promise: topsMayAnswer, resolve: letTopsAnswer } = Promise.withResolvers<void>();
    let askedForTops = false;
    signedIn();
    server.use(
      http.get(`${API}/items`, async ({ request }) => {
        const slot = new URL(request.url).searchParams.get('slot');

        if (slot === 'top') {
          askedForTops = true;
          await topsMayAnswer;
        }

        return HttpResponse.json({
          items: slot === 'top' ? [blouse] : [loafers],
          nextCursor: null,
        });
      }),
    );
    renderApp('/wardrobe?slot=shoes');
    await screen.findByText('Loafers');

    await person.selectOptions(screen.getByLabelText(uk.wardrobe.slot), uk.slots.top);
    await expect.poll(() => askedForTops).toBe(true);

    expect(screen.queryByText('Loafers')).not.toBeInTheDocument();
    letTopsAnswer();
    expect(await screen.findByText('Blouse')).toBeInTheDocument();
  });
});

describe('Requirement: A change shows wherever it is seen', () => {
  it('Scenario: A new item is in the wardrobe', async () => {
    const person = userEvent.setup();
    const added = anItem({ id: 'added', slot: 'shoes', type: 'loafers', name: 'Added loafers' });
    const stored: object[] = [];
    signedIn();
    server.use(
      http.get(`${API}/items`, () => HttpResponse.json({ items: stored, nextCursor: null })),
      http.post(`${API}/items/upload-url`, () =>
        HttpResponse.json({ key: 'items/owner/photo.png', url: 'https://storage.test/upload' }),
      ),
      http.put('https://storage.test/upload', () => new HttpResponse(null, { status: 200 })),
      http.post(`${API}/items`, () => {
        stored.push(added);

        return HttpResponse.json(added, { status: 201 });
      }),
      http.get(`${API}/items/added`, () => HttpResponse.json(added)),
    );
    renderApp('/wardrobe');
    await screen.findByText(uk.wardrobe.empty);

    await person.click(screen.getByRole('link', { name: uk.wardrobe.add }));
    await person.type(await screen.findByLabelText(uk.newItem.name), 'Added loafers');
    await person.upload(
      screen.getByLabelText(uk.newItem.photo),
      new File(['bytes'], 'loafers.png', { type: 'image/png' }),
    );
    await person.click(screen.getByRole('button', { name: uk.newItem.submit }));
    await screen.findByRole('region', { name: 'Added loafers' });
    await person.click(screen.getByRole('button', { name: uk.window.back }));

    const list = await screen.findByRole('list', { name: uk.wardrobe.title });
    expect(within(list).getByText('Added loafers')).toBeInTheDocument();
  });

  it('Scenario: An archived item is gone from the wardrobe', async () => {
    const person = userEvent.setup();
    signedIn();
    const api = theWardrobeAnswersOnceThenWaits([blazer, loafers], [loafers]);
    server.use(
      http.get(`${API}/items/blazer`, () => HttpResponse.json(blazer)),
      http.delete(`${API}/items/blazer`, () =>
        HttpResponse.json({ ...blazer, status: 'archived' }),
      ),
    );
    renderApp('/wardrobe');
    await person.click(await screen.findByRole('link', { name: 'Blazer' }));
    await person.selectOptions(
      await screen.findByLabelText(uk.item.reason),
      uk.archiveReasons.given_away,
    );

    await person.click(screen.getByRole('button', { name: uk.item.archive }));

    // Before the API has answered the list again, so this is what was remembered.
    await wardrobe();
    expect(screen.queryByText('Blazer')).not.toBeInTheDocument();
    expect(screen.getByText('Loafers')).toBeInTheDocument();
    api.letAnswer();
  });

  it('Scenario: Sharing is remembered on the card', async () => {
    const person = userEvent.setup();
    const { promise: mayAnswer, resolve: letAnswer } = Promise.withResolvers<void>();
    let opened = 0;
    signedIn();
    server.use(
      http.get(`${API}/items`, () => HttpResponse.json({ items: [blazer], nextCursor: null })),
      http.get(`${API}/items/blazer`, async () => {
        opened += 1;

        if (opened > 1) {
          await mayAnswer;
        }

        return HttpResponse.json(opened > 1 ? { ...blazer, visibility: 'friends' } : blazer);
      }),
      http.patch(`${API}/items/blazer`, () =>
        HttpResponse.json({ ...blazer, visibility: 'friends' }),
      ),
    );
    renderApp('/wardrobe/blazer');
    await person.click(await screen.findByRole('checkbox', { name: uk.item.share }));
    await screen.findByText(uk.visibility.friends);
    await person.click(screen.getByRole('button', { name: uk.window.back }));

    await person.click(await screen.findByRole('link', { name: 'Blazer' }));

    expect(await screen.findByText(uk.visibility.friends)).toBeInTheDocument();
    expect(opened).toBe(2);
    letAnswer();
  });

  it('Scenario: Reading a conversation clears its count', async () => {
    const person = userEvent.setup();
    let unread = 2;
    signedIn();
    server.use(
      http.get(`${API}/conversations`, () => HttpResponse.json([aConversation('dionne', unread)])),
      http.get(`${API}/conversations/with/dionne/messages`, () =>
        HttpResponse.json({ items: [], nextCursor: null }),
      ),
      http.post(`${API}/conversations/with/dionne/read`, () => {
        unread = 0;

        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${API}/users/dionne`, () =>
        HttpResponse.json({ id: 'id-of-dionne', username: 'dionne', displayName: null }),
      ),
      http.get(`${API}/friends/blocked`, () => HttpResponse.json([])),
      http.get(`${API}/friends`, () => HttpResponse.json([aRelation('dionne')])),
    );
    renderApp('/');
    const shortcut = await screen.findByRole('link', { name: new RegExp(uk.chat.title) });
    await within(shortcut).findByLabelText(uk.chat.unread(2));

    await person.click(shortcut);
    await person.click(await screen.findByRole('link', { name: /dionne/ }));
    await expect.poll(() => unread).toBe(0);
    await person.click(screen.getByRole('button', { name: uk.window.back }));
    await person.click(await screen.findByRole('button', { name: uk.window.back }));

    const again = await screen.findByRole('link', { name: new RegExp(uk.chat.title) });
    await expect.poll(() => within(again).queryByLabelText(uk.chat.unread(2))).toBeNull();
  });
});
