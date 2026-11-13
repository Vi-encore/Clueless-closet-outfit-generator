import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { uk } from '../../shared/i18n/uk';
import { aRelation, anItem, signedIn } from '../../../test/api-fixtures';
import { renderApp } from '../../../test/render-app';
import { API, server } from '../../../test/server';
import { socketServer } from '../../../test/socket-server';
import type { People } from '../../../test/test.interfaces';

/** What the API holds about a person's relations, each list on its own route. */
function theApiHolds(people: People) {
  server.use(
    http.get(`${API}/friends`, () => HttpResponse.json(people.friends ?? [])),
    http.get(`${API}/friends/requests`, () => HttpResponse.json(people.waiting ?? [])),
    http.get(`${API}/friends/requests/sent`, () => HttpResponse.json(people.sent ?? [])),
    http.get(`${API}/friends/blocked`, () => HttpResponse.json(people.blocked ?? [])),
  );
}

const friendsScreen = () => screen.findByRole('region', { name: uk.friends.title });
const sheet = (name: string) => screen.findByRole('region', { name });

describe('Requirement: Your friends are listed', () => {
  it('Scenario: The desktop opens the friends screen', async () => {
    const person = userEvent.setup();
    signedIn();
    theApiHolds({});
    renderApp('/');

    await person.click(await screen.findByRole('link', { name: uk.friends.title }));

    expect(await friendsScreen()).toBeInTheDocument();
  });

  it('Scenario: A friend is named', async () => {
    signedIn();
    theApiHolds({ friends: [aRelation('dionne', 'Dionne Davenport')] });

    renderApp('/friends');

    expect(await screen.findByRole('link', { name: 'Dionne Davenport' })).toHaveAttribute(
      'href',
      '/friends/dionne',
    );
  });

  it('Scenario: A friend without a display name goes by their username', async () => {
    signedIn();
    theApiHolds({ friends: [aRelation('tai')] });

    renderApp('/friends');

    expect(await screen.findByRole('link', { name: 'tai' })).toBeInTheDocument();
  });

  it('Scenario: No friends says so', async () => {
    signedIn();
    theApiHolds({});

    renderApp('/friends');

    expect(await screen.findByText(uk.friends.none)).toBeInTheDocument();
  });
});

describe('Requirement: A person is asked by their exact username', () => {
  it('Scenario: A request is sent', async () => {
    const person = userEvent.setup();
    const people: People = {};
    signedIn();
    theApiHolds(people);
    server.use(
      http.post(`${API}/friends/dionne`, () => {
        people.sent = [aRelation('dionne', null, { status: 'pending', requestedByMe: true })];

        return HttpResponse.json(people.sent[0], { status: 201 });
      }),
    );
    renderApp('/friends');

    await person.type(await screen.findByLabelText(uk.friends.username), 'dionne');
    await person.click(screen.getByRole('button', { name: uk.friends.ask }));

    const sent = await sheet(uk.friends.sent);
    expect(within(sent).getByText('dionne')).toBeInTheDocument();
    expect(screen.getByLabelText(uk.friends.username)).toHaveValue('');
  });

  it('Scenario: Nobody by that name', async () => {
    const person = userEvent.setup();
    signedIn();
    theApiHolds({});
    server.use(http.post(`${API}/friends/nobody`, () => new HttpResponse(null, { status: 404 })));
    renderApp('/friends');

    await person.type(await screen.findByLabelText(uk.friends.username), 'nobody');
    await person.click(screen.getByRole('button', { name: uk.friends.ask }));

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(uk.friends.nobody);
  });
});

describe('Requirement: A request is answered', () => {
  const dionne = aRelation('dionne', null, { status: 'pending' });

  it('Scenario: Accepting makes a friend', async () => {
    const person = userEvent.setup();
    const people: People = { waiting: [dionne] };
    signedIn();
    theApiHolds(people);
    server.use(
      http.post(`${API}/friends/dionne/accept`, () => {
        people.waiting = [];
        people.friends = [aRelation('dionne')];

        return HttpResponse.json(people.friends[0]);
      }),
    );
    renderApp('/friends');
    const waiting = await sheet(uk.friends.waiting);

    await person.click(
      within(waiting).getByRole('button', { name: `${uk.friends.accept}: dionne` }),
    );

    const yours = await sheet(uk.friends.yours);
    expect(await within(yours).findByRole('link', { name: 'dionne' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: uk.friends.waiting })).not.toBeInTheDocument();
  });

  it('Scenario: Declining removes the request', async () => {
    const person = userEvent.setup();
    const people: People = { waiting: [dionne] };
    let declined = 0;
    signedIn();
    theApiHolds(people);
    server.use(
      http.delete(`${API}/friends/dionne`, () => {
        declined += 1;
        people.waiting = [];

        return new HttpResponse(null, { status: 200 });
      }),
    );
    renderApp('/friends');
    await sheet(uk.friends.waiting);

    await person.click(screen.getByRole('button', { name: `${uk.friends.decline}: dionne` }));

    await expect.poll(() => screen.queryByRole('region', { name: uk.friends.waiting })).toBeNull();
    expect(declined).toBe(1);
    expect(screen.queryByRole('link', { name: 'dionne' })).not.toBeInTheDocument();
  });
});

describe('Requirement: A sent request can be withdrawn', () => {
  it('Scenario: Withdrawing a request', async () => {
    const person = userEvent.setup();
    const people: People = {
      sent: [aRelation('dionne', null, { status: 'pending', requestedByMe: true })],
    };
    let withdrawn = 0;
    signedIn();
    theApiHolds(people);
    server.use(
      http.delete(`${API}/friends/dionne`, () => {
        withdrawn += 1;
        people.sent = [];

        return new HttpResponse(null, { status: 200 });
      }),
    );
    renderApp('/friends');
    await sheet(uk.friends.sent);

    await person.click(screen.getByRole('button', { name: `${uk.friends.withdraw}: dionne` }));

    await expect.poll(() => screen.queryByRole('region', { name: uk.friends.sent })).toBeNull();
    expect(withdrawn).toBe(1);
  });
});

describe('Requirement: A friend can be removed or blocked', () => {
  /** A person with one friend, and an API that lets go of them however it is asked. */
  function aFriendship() {
    const people: People = { friends: [aRelation('dionne')] };
    const told = { removed: 0, blocked: 0 };

    signedIn();
    theApiHolds(people);
    server.use(
      http.delete(`${API}/friends/dionne`, () => {
        told.removed += 1;
        people.friends = [];

        return new HttpResponse(null, { status: 200 });
      }),
      http.post(`${API}/friends/dionne/block`, () => {
        told.blocked += 1;
        people.friends = [];
        people.blocked = [aRelation('dionne', null, { status: 'blocked' })];

        return HttpResponse.json(people.blocked[0]);
      }),
    );

    return told;
  }

  it('Scenario: Removing a friend', async () => {
    const person = userEvent.setup();
    const told = aFriendship();
    renderApp('/friends');

    await person.click(await screen.findByRole('button', { name: `${uk.friends.remove}: dionne` }));
    const dialog = await screen.findByRole('alertdialog');
    await person.click(within(dialog).getByRole('button', { name: uk.friends.remove }));

    expect(await screen.findByText(uk.friends.none)).toBeInTheDocument();
    expect(told.removed).toBe(1);
  });

  it("Scenario: Changing one's mind", async () => {
    const person = userEvent.setup();
    const told = aFriendship();
    renderApp('/friends');

    await person.click(await screen.findByRole('button', { name: `${uk.friends.remove}: dionne` }));
    const cancel = within(await screen.findByRole('alertdialog')).getByRole('button', {
      name: uk.dialog.cancel,
    });

    // Where Enter would land, out of habit.
    expect(cancel).toHaveFocus();
    await person.keyboard('{Enter}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(told.removed).toBe(0);
    expect(screen.getByRole('link', { name: 'dionne' })).toBeInTheDocument();
  });

  it('Scenario: Blocking a friend', async () => {
    const person = userEvent.setup();
    const told = aFriendship();
    renderApp('/friends');

    await person.click(await screen.findByRole('button', { name: `${uk.friends.block}: dionne` }));
    const dialog = await screen.findByRole('alertdialog');
    await person.click(within(dialog).getByRole('button', { name: uk.friends.block }));

    const blocked = await sheet(uk.friends.blocked);
    expect(within(blocked).getByText('dionne')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'dionne' })).not.toBeInTheDocument();
    expect(told.blocked).toBe(1);
  });
});

describe('Requirement: A block can be undone', () => {
  it('Scenario: Unblocking', async () => {
    const person = userEvent.setup();
    const people: People = { blocked: [aRelation('tai', null, { status: 'blocked' })] };
    let lifted = 0;
    signedIn();
    theApiHolds(people);
    server.use(
      http.delete(`${API}/friends/tai`, () => {
        lifted += 1;
        people.blocked = [];

        return new HttpResponse(null, { status: 200 });
      }),
    );
    renderApp('/friends');
    await sheet(uk.friends.blocked);

    await person.click(screen.getByRole('button', { name: `${uk.friends.unblock}: tai` }));

    await expect.poll(() => screen.queryByRole('region', { name: uk.friends.blocked })).toBeNull();
    expect(lifted).toBe(1);
  });
});

describe("Requirement: A friend's wardrobe can be read", () => {
  it("Scenario: A button leads to a friend's wardrobe", async () => {
    const person = userEvent.setup();
    signedIn();
    theApiHolds({ friends: [aRelation('dionne', 'Dionne Davenport')] });
    server.use(
      http.get(`${API}/users/dionne/items`, () =>
        HttpResponse.json({ items: [], nextCursor: null }),
      ),
    );
    renderApp('/friends');

    await person.click(
      await screen.findByRole('link', {
        name: `${uk.friends.openWardrobe}: Dionne Davenport`,
      }),
    );

    expect(
      await screen.findByRole('region', { name: uk.friends.wardrobeOf('Dionne Davenport') }),
    ).toBeInTheDocument();
  });

  it("Scenario: A friend's shared items are shown", async () => {
    signedIn();
    server.use(
      http.get(`${API}/users/dionne/items`, () =>
        HttpResponse.json({
          items: [anItem({ name: 'Red coat', photoUrl: 'https://photos.test/coat.webp' })],
          nextCursor: null,
        }),
      ),
    );

    renderApp('/friends/dionne');

    expect(await screen.findByRole('img', { name: 'Red coat' })).toHaveAttribute(
      'src',
      'https://photos.test/coat.webp',
    );
    expect(
      screen.getByRole('region', { name: uk.friends.wardrobeOf('dionne') }),
    ).toBeInTheDocument();
    // Looking and nothing more: a friend's item has no card to open.
    expect(screen.queryByRole('link', { name: 'Red coat' })).not.toBeInTheDocument();
  });

  it('Scenario: Nothing shared says so', async () => {
    signedIn();
    server.use(
      http.get(`${API}/users/dionne/items`, () =>
        HttpResponse.json({ items: [], nextCursor: null }),
      ),
    );

    renderApp('/friends/dionne');

    expect(await screen.findByText(uk.friends.nothingShared)).toBeInTheDocument();
  });

  it("Scenario: A stranger's wardrobe is simply not there", async () => {
    signedIn();
    server.use(http.get(`${API}/users/tai/items`, () => new HttpResponse(null, { status: 404 })));

    renderApp('/friends/tai');

    expect(await screen.findByRole('region', { name: uk.notFound.title })).toBeInTheDocument();
  });
});

describe('Requirement: Friends are kept up to date while the app is open', () => {
  /** The live connection is up, so that what it is told next reaches the screen. */
  async function connected() {
    await expect.poll(() => socketServer.connected).toBe(1);
  }

  it('Scenario: An accepted request moves on its own', async () => {
    signedIn();
    theApiHolds({
      sent: [aRelation('dionne', 'Dionne Davenport', { status: 'pending', requestedByMe: true })],
    });
    renderApp('/friends');
    await sheet(uk.friends.sent);
    await connected();

    theApiHolds({ friends: [aRelation('dionne', 'Dionne Davenport')] });
    socketServer.emit('friends:changed', undefined);

    const friends = await sheet(uk.friends.yours);
    expect(await within(friends).findByText('Dionne Davenport')).toBeInTheDocument();
    await expect.poll(() => screen.queryByRole('region', { name: uk.friends.sent })).toBeNull();
  });

  it('Scenario: A new request appears on its own', async () => {
    signedIn();
    theApiHolds({});
    renderApp('/friends');
    await friendsScreen();
    await connected();

    theApiHolds({ waiting: [aRelation('tai', 'Tai Frasier', { status: 'pending' })] });
    socketServer.emit('friends:changed', undefined);

    const waiting = await sheet(uk.friends.waiting);
    expect(within(waiting).getByText('Tai Frasier')).toBeInTheDocument();
  });
});
