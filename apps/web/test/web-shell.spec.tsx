import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { uk } from '../src/shared/i18n/uk';
import { RequireGuest, RequireSession, SessionProvider, SignIn } from '../src/features/session';
import { renderApp } from './render-app';
import { API, server } from './server';

function WhereThisIs() {
  const { pathname, search } = useLocation();

  return <p>{pathname + search}</p>;
}

describe('Requirement: Every screen is a window', () => {
  it('Scenario: The frame names the screen', async () => {
    renderApp('/sign-in');

    const frame = await screen.findByRole('region', { name: uk.signIn.title });

    expect(within(frame).getByRole('heading', { name: uk.signIn.title })).toBeInTheDocument();
  });

  it('Scenario: Closing goes back', async () => {
    const person = userEvent.setup();
    renderApp('/sign-in');
    await person.click(await screen.findByRole('link', { name: uk.signIn.toSignUp }));
    expect(await screen.findByRole('region', { name: uk.signUp.title })).toBeInTheDocument();

    await person.click(screen.getByRole('button', { name: uk.window.close }));

    expect(await screen.findByRole('region', { name: uk.signIn.title })).toBeInTheDocument();
  });

  it('Scenario: The taskbar is always there', async () => {
    for (const path of ['/', '/sign-in', '/sign-up', '/nowhere/at/all']) {
      const { unmount } = renderApp(path);

      expect(await screen.findByRole('navigation', { name: uk.taskbar.label })).toBeInTheDocument();

      unmount();
    }
  });
});

describe('Requirement: The URL decides the screen', () => {
  it('Scenario: An unknown path says so', async () => {
    renderApp('/nowhere/at/all');

    expect(await screen.findByRole('region', { name: uk.notFound.title })).toBeInTheDocument();
    expect(screen.getByText(uk.notFound.message)).toBeInTheDocument();
  });

  it('Scenario: A screen that needs a session asks for one', async () => {
    renderApp('/');

    expect(await screen.findByRole('region', { name: uk.signIn.title })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: uk.desktop.title })).not.toBeInTheDocument();
  });

  it('Scenario: Signing in continues where it was interrupted', async () => {
    const person = userEvent.setup();
    server.use(
      http.post(`${API}/auth/sign-in`, () => HttpResponse.json({ accessToken: 'token' })),
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({
          id: 'some-id',
          email: 'cher@example.com',
          username: 'cher',
          displayName: null,
        }),
      ),
    );
    // The real guards and the real sign-in screen, around a stand-in for a screen of the
    // next change: `/` is the only guarded path today, and it is also where a sign-in
    // lands by default, so it could not tell continuing from having gone nowhere.
    render(
      <MemoryRouter initialEntries={['/wardrobe?slot=shoes']}>
        <SessionProvider>
          <Routes>
            <Route element={<RequireGuest />}>
              <Route path="sign-in" element={<SignIn />} />
            </Route>
            <Route element={<RequireSession />}>
              <Route path="wardrobe" element={<WhereThisIs />} />
            </Route>
          </Routes>
        </SessionProvider>
      </MemoryRouter>,
    );

    await person.type(await screen.findByLabelText(uk.signIn.email), 'cher@example.com');
    await person.type(screen.getByLabelText(uk.signIn.password), 'as if! whatever');
    await person.click(screen.getByRole('button', { name: uk.signIn.submit }));

    expect(await screen.findByText('/wardrobe?slot=shoes')).toBeInTheDocument();
  });
});

describe('Requirement: A refused form opens a dialog', () => {
  /** The sign-in form, refused, with the error window open over it. */
  async function refused() {
    const person = userEvent.setup();
    server.use(http.post(`${API}/auth/sign-in`, () => new HttpResponse(null, { status: 401 })));
    renderApp('/sign-in');

    await person.type(await screen.findByLabelText(uk.signIn.email), 'cher@example.com');
    await person.type(screen.getByLabelText(uk.signIn.password), 'as if! whatever');
    await person.click(screen.getByRole('button', { name: uk.signIn.submit }));

    return { person, dialog: await screen.findByRole('alertdialog', { name: uk.dialog.error }) };
  }

  it('Scenario: A refused form opens a dialog', async () => {
    const { dialog } = await refused();

    expect(dialog).toHaveTextContent(uk.signIn.refused);
    expect(within(dialog).getByRole('button', { name: uk.dialog.ok })).toHaveFocus();
  });

  it('Scenario: The dialog is dismissed with OK', async () => {
    const { person, dialog } = await refused();

    await person.click(within(dialog).getByRole('button', { name: uk.dialog.ok }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText(uk.signIn.email)).toHaveValue('cher@example.com');
  });

  it('Scenario: Escape dismisses the dialog', async () => {
    const { person } = await refused();

    await person.keyboard('{Escape}');

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});

describe('Requirement: Ukrainian text comes from one dictionary', () => {
  it('Scenario: A label reads its text from the dictionary', async () => {
    renderApp('/sign-in');

    expect(await screen.findByLabelText(uk.signIn.password)).toHaveAttribute('type', 'password');
    expect(uk.signIn.password).toMatch(/\p{Script=Cyrillic}/u);
  });

  it('Scenario: No component holds its own', () => {
    const source = join(import.meta.dirname, '..', 'src');
    const dictionary = join('shared', 'i18n', 'uk.ts');

    const files = readdirSync(source, { recursive: true, encoding: 'utf8' })
      .filter((file) => /\.(ts|tsx|css)$/.test(file))
      .filter((file) => file !== dictionary);
    const offenders = files.filter((file) =>
      /\p{Script=Cyrillic}/u.test(readFileSync(join(source, file), 'utf8')),
    );

    // Guards the guard: a wrong path would find no files, and no files means no
    // offenders, so a broken test would pass for ever.
    expect(files).toContain('main.tsx');
    expect(offenders).toEqual([]);
  });
});
