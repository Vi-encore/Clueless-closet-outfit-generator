import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { uk } from '../src/i18n/uk';
import { renderApp } from './render-app';

describe('Requirement: Every screen is a window', () => {
  it('Scenario: The frame names the screen', () => {
    renderApp('/sign-in');

    const frame = screen.getByRole('region', { name: uk.signIn.title });

    expect(within(frame).getByRole('heading', { name: uk.signIn.title })).toBeInTheDocument();
  });

  it('Scenario: Closing goes back', async () => {
    const person = userEvent.setup();
    renderApp('/sign-in');
    await person.click(screen.getByRole('link', { name: uk.signIn.toSignUp }));
    expect(screen.getByRole('region', { name: uk.signUp.title })).toBeInTheDocument();

    await person.click(screen.getByRole('button', { name: uk.window.close }));

    expect(screen.getByRole('region', { name: uk.signIn.title })).toBeInTheDocument();
  });

  it('Scenario: The taskbar is always there', () => {
    for (const path of ['/', '/sign-in', '/sign-up', '/nowhere/at/all']) {
      const { unmount } = renderApp(path);

      expect(screen.getByRole('navigation', { name: uk.taskbar.label })).toBeInTheDocument();

      unmount();
    }
  });
});

describe('Requirement: The URL decides the screen', () => {
  it('Scenario: An unknown path says so', () => {
    renderApp('/nowhere/at/all');

    expect(screen.getByRole('region', { name: uk.notFound.title })).toBeInTheDocument();
    expect(screen.getByText(uk.notFound.message)).toBeInTheDocument();
  });
});

describe('Requirement: Ukrainian text comes from one dictionary', () => {
  it('Scenario: A label reads its text from the dictionary', () => {
    renderApp('/sign-in');

    expect(screen.getByLabelText(uk.signIn.password)).toHaveAttribute('type', 'password');
    expect(uk.signIn.password).toMatch(/\p{Script=Cyrillic}/u);
  });

  it('Scenario: No component holds its own', () => {
    const source = join(import.meta.dirname, '..', 'src');
    const dictionary = join('i18n', 'uk.ts');

    const files = readdirSync(source, { recursive: true, encoding: 'utf8' })
      .filter((file) => /\.(ts|tsx|css)$/.test(file))
      .filter((file) => file !== dictionary);
    const offenders = files.filter((file) =>
      /\p{Script=Cyrillic}/u.test(readFileSync(join(source, file), 'utf8')),
    );

    // Guards the guard: a wrong path would find no files, and no files means no
    // offenders, so a broken test would pass for ever.
    expect(files).toContain('app.tsx');
    expect(offenders).toEqual([]);
  });
});
