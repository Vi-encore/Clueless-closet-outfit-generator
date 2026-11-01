import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Relation } from '../src/api/api.interfaces';
import { uk } from '../src/i18n/uk';
import { aRelation, signedIn } from './api-fixtures';
import { renderApp } from './render-app';
import { API, server } from './server';

interface People {
  friends?: Relation[];
  waiting?: Relation[];
  sent?: Relation[];
  blocked?: Relation[];
}

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
