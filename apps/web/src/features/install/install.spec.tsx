import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { uk } from '../../shared/i18n/uk';
import { signedIn } from '../../../test/api-fixtures';
import { renderApp } from '../../../test/render-app';
import { INSTALL_HINT_DISMISSED } from './install.constants';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1';

const desktop = () => screen.findByRole('region', { name: uk.desktop.title });

/** What Chrome hands a page it would install: an event to keep, and a prompt to open later. */
function browserOffersToInstall() {
  const prompt = vi.fn(() => Promise.resolve());
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
  });

  act(() => {
    window.dispatchEvent(event);
  });

  return prompt;
}

/** Running as the installed app, which a browser says through the display mode. */
function runningInstalled() {
  vi.stubGlobal(
    'matchMedia',
    (query: string) =>
      ({ matches: query === '(display-mode: standalone)', media: query }) as MediaQueryList,
  );
}

function onAnIphone() {
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(IPHONE_SAFARI);
}

afterEach(() => {
  // The kept event outlives a render, as it outlives a screen; installing is what ends it.
  window.dispatchEvent(new Event('appinstalled'));
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('Requirement: Where the browser offers installing, the app does too', () => {
  it("Scenario: The offer appears with the browser's event", async () => {
    signedIn();
    renderApp('/');
    await desktop();

    browserOffersToInstall();

    expect(await screen.findByRole('button', { name: uk.install.offer })).toBeInTheDocument();
  });

  it("Scenario: Pressing it opens the browser's prompt", async () => {
    const person = userEvent.setup();
    signedIn();
    renderApp('/');
    await desktop();
    const prompt = browserOffersToInstall();

    await person.click(await screen.findByRole('button', { name: uk.install.offer }));

    expect(prompt).toHaveBeenCalledTimes(1);
    await expect.poll(() => screen.queryByRole('button', { name: uk.install.offer })).toBeNull();
  });

  it('Scenario: Without the event there is no button', async () => {
    signedIn();
    renderApp('/');
    await desktop();

    expect(screen.queryByRole('button', { name: uk.install.offer })).not.toBeInTheDocument();
  });
});

describe('Requirement: An iPhone is told how to install', () => {
  it('Scenario: The hint is shown in Safari on an iPhone', async () => {
    onAnIphone();
    signedIn();

    renderApp('/');

    expect(await screen.findByText(uk.install.iosHint)).toBeInTheDocument();
  });

  it('Scenario: A dismissed hint stays dismissed', async () => {
    const person = userEvent.setup();
    onAnIphone();
    signedIn();
    const { unmount } = renderApp('/');
    await person.click(await screen.findByRole('button', { name: uk.install.dismiss }));
    expect(screen.queryByText(uk.install.iosHint)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(INSTALL_HINT_DISMISSED)).not.toBeNull();
    unmount();

    signedIn();
    renderApp('/');
    await desktop();

    expect(screen.queryByText(uk.install.iosHint)).not.toBeInTheDocument();
  });

  it('Scenario: The installed app shows no hint', async () => {
    onAnIphone();
    runningInstalled();
    signedIn();
    renderApp('/');
    await desktop();

    browserOffersToInstall();

    expect(screen.queryByText(uk.install.iosHint)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: uk.install.offer })).not.toBeInTheDocument();
  });
});
