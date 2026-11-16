import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { uk } from '../../shared/i18n/uk';
import { aRelation, anItem, signedIn } from '../../../test/api-fixtures';
import { MemoryRouter, useLocation } from 'react-router';
import { App } from '../../app/app';
import { renderApp } from '../../../test/render-app';
import { API, server } from '../../../test/server';
import { socketServer } from '../../../test/socket-server';
import type { DeviceFeatures, People } from '../../../test/test.interfaces';

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

describe('Requirement: The desktop counts the requests waiting', () => {
  const shortcut = () => screen.findByRole('link', { name: new RegExp(uk.friends.title) });

  it('Scenario: Waiting requests are counted', async () => {
    signedIn();
    theApiHolds({
      waiting: [
        aRelation('dionne', null, { status: 'pending' }),
        aRelation('tai', null, { status: 'pending' }),
      ],
    });

    renderApp('/');

    expect(
      await within(await shortcut()).findByLabelText(uk.friends.waitingCount(2)),
    ).toHaveTextContent('2');
  });

  it('Scenario: A request arriving changes the count', async () => {
    signedIn();
    theApiHolds({});
    renderApp('/');
    const friends = await shortcut();
    await expect.poll(() => socketServer.connected).toBe(1);
    expect(within(friends).queryByLabelText(uk.friends.waitingCount(1))).not.toBeInTheDocument();

    theApiHolds({ waiting: [aRelation('tai', null, { status: 'pending' })] });
    socketServer.emit('friends:changed', undefined);

    expect(await within(friends).findByLabelText(uk.friends.waitingCount(1))).toHaveTextContent(
      '1',
    );
  });
});

describe('Requirement: A person can share a link to themselves', () => {
  /** Puts a browser feature in place, or takes it away, for one test. */
  function device(features: DeviceFeatures) {
    Object.defineProperty(window.navigator, 'share', {
      value: features.share,
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'clipboard', {
      value: features.clipboard,
      configurable: true,
    });
  }

  afterEach(() => {
    device({});
  });

  /** A plain click: user-event would put a clipboard of its own on the page. */
  async function pressShare() {
    signedIn();
    theApiHolds({});
    renderApp('/friends');
    fireEvent.click(await screen.findByRole('button', { name: uk.friends.shareLink }));
  }

  it('Scenario: The share sheet gets the link', async () => {
    const share = vi.fn(() => Promise.resolve());
    device({ share });

    await pressShare();

    await expect.poll(() => share.mock.calls.length).toBe(1);
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringMatching(/\/friends\?add=cher$/) }),
    );
  });

  it('Scenario: Without a share sheet the link is copied', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    device({ clipboard: { writeText } });

    await pressShare();

    expect(await screen.findByText(uk.friends.copied)).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/friends\?add=cher$/));
  });

  it('Scenario: With neither, the link is shown', async () => {
    device({});

    await pressShare();

    expect(await screen.findByLabelText(uk.friends.copyByHand)).toHaveValue(
      `${window.location.origin}/friends?add=cher`,
    );
  });

  it('Scenario: Cancelling the share sheet says nothing', async () => {
    const share = vi.fn(() => Promise.reject(new DOMException('closed', 'AbortError')));
    const writeText = vi.fn(() => Promise.resolve());
    device({ share, clipboard: { writeText } });

    await pressShare();

    await expect.poll(() => share.mock.calls.length).toBe(1);
    expect(screen.queryByText(uk.friends.copied)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(uk.friends.copyByHand)).not.toBeInTheDocument();
    expect(writeText).not.toHaveBeenCalled();
  });
});

describe('Requirement: An invitation link offers to ask, and asks only when told', () => {
  /** Where the app is, written out, so a test can read what the address says. */
  function Where() {
    const { pathname, search } = useLocation();

    return <output aria-label="address">{pathname + search}</output>;
  }

  /** The app opened at a link, with the address on show; and every request to ask Dionne. */
  function openLink(path: string) {
    const asked: string[] = [];
    server.use(
      http.post(`${API}/friends/:username`, ({ params }) => {
        asked.push(String(params.username));

        return HttpResponse.json(
          aRelation(String(params.username), null, { status: 'pending', requestedByMe: true }),
          { status: 201 },
        );
      }),
    );
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
        <Where />
      </MemoryRouter>,
    );

    return asked;
  }

  it('Scenario: Opening a link sends nothing', async () => {
    signedIn();
    theApiHolds({});
    const asked = openLink('/friends?add=dionne');

    expect(await screen.findByText(uk.friends.inviteOffer('dionne'))).toBeInTheDocument();
    expect(asked).toEqual([]);
  });

  it('Scenario: Pressing sends the request', async () => {
    const person = userEvent.setup();
    signedIn();
    theApiHolds({});
    const asked = openLink('/friends?add=dionne');
    const send = await screen.findByRole('button', { name: uk.friends.sendRequest });
    theApiHolds({ sent: [aRelation('dionne', null, { status: 'pending', requestedByMe: true })] });

    await person.click(send);

    expect(within(await sheet(uk.friends.sent)).getByText('dionne')).toBeInTheDocument();
    expect(asked).toEqual(['dionne']);
    expect(screen.queryByText(uk.friends.inviteOffer('dionne'))).not.toBeInTheDocument();
    expect(screen.getByLabelText('address')).toHaveTextContent(/^\/friends$/);
  });

  it('Scenario: Declining sends nothing', async () => {
    const person = userEvent.setup();
    signedIn();
    theApiHolds({});
    const asked = openLink('/friends?add=dionne');

    await person.click(await screen.findByRole('button', { name: uk.friends.notNow }));

    expect(screen.queryByText(uk.friends.inviteOffer('dionne'))).not.toBeInTheDocument();
    expect(asked).toEqual([]);
  });

  it('Scenario: Somebody the API refuses is nobody', async () => {
    const person = userEvent.setup();
    signedIn();
    theApiHolds({});
    openLink('/friends?add=nobody');
    server.use(http.post(`${API}/friends/nobody`, () => new HttpResponse(null, { status: 404 })));

    await person.click(await screen.findByRole('button', { name: uk.friends.sendRequest }));

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(uk.friends.nobody);
  });

  it("Scenario: One's own link", async () => {
    signedIn();
    theApiHolds({});
    const asked = openLink('/friends?add=cher');

    expect(await screen.findByText(uk.friends.ownLink)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: uk.friends.sendRequest })).not.toBeInTheDocument();
    expect(asked).toEqual([]);
  });

  it('Scenario: The link survives signing in', async () => {
    const person = userEvent.setup();
    theApiHolds({});
    openLink('/friends?add=dionne');
    await person.type(await screen.findByLabelText(uk.signIn.email), 'cher@example.com');
    await person.type(screen.getByLabelText(uk.signIn.password), 'as if! whatever');
    signedIn();
    server.use(
      http.post(`${API}/auth/sign-in`, () => HttpResponse.json({ accessToken: 'a-token' })),
    );

    await person.click(screen.getByRole('button', { name: uk.signIn.submit }));

    expect(await screen.findByText(uk.friends.inviteOffer('dionne'))).toBeInTheDocument();
  });
});
