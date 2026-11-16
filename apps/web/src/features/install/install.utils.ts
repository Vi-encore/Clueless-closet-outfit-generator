import { INSTALL_HINT_DISMISSED } from './install.constants';
import type { BeforeInstallPromptEvent, IosNavigator } from './install.interfaces';

/**
 * An iPhone, iPod or iPad. An iPad on iPadOS says it is a Mac, so a Mac with a touch
 * screen counts too: no Mac has one.
 */
export function isIos(userAgent: string, maxTouchPoints: number): boolean {
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

/** Running as the installed app, from the home screen or the app list, with no browser bars. */
export function isStandalone(): boolean {
  const standalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;

  return standalone || (window.navigator as IosNavigator).standalone === true;
}

/** Storage that refuses, as a private window's may, simply forgets the dismissal. */
export function hintDismissed(): boolean {
  try {
    return window.localStorage.getItem(INSTALL_HINT_DISMISSED) !== null;
  } catch {
    return false;
  }
}

export function dismissHint(): void {
  try {
    window.localStorage.setItem(INSTALL_HINT_DISMISSED, String(Date.now()));
  } catch {
    // Not remembered: the hint comes back next time, which is a small price.
  }
}

/**
 * The browser's install event, kept from the moment the app loads. Chrome fires it when it
 * decides to, which may well be while the person is on another screen; a listener on the
 * desktop alone would miss it. One event at a time: a newer one replaces it.
 */
let kept: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function changed(): void {
  for (const listener of listeners) {
    listener();
  }
}

window.addEventListener('beforeinstallprompt', (event) => {
  // Without this the browser shows its own mini bar at a moment of its choosing.
  event.preventDefault();
  kept = event as BeforeInstallPromptEvent;
  changed();
});

window.addEventListener('appinstalled', () => {
  kept = null;
  changed();
});

/** For `useSyncExternalStore`: hears every change to the kept event. */
export function onInstallEvent(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function keptInstallEvent(): BeforeInstallPromptEvent | null {
  return kept;
}

/** Opens the browser's prompt. An event opens it once; whatever the answer, it is spent. */
export function promptToInstall(): void {
  const event = kept;

  kept = null;
  changed();
  void event?.prompt();
}
