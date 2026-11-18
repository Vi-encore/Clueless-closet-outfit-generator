import { useEffect, useState, useSyncExternalStore } from 'react';
import type { InstallOfferState } from './install.interfaces';
import {
  dismissHint,
  hintDismissed,
  isIos,
  isStandalone,
  keptInstallEvent,
  onInstallEvent,
  promptToInstall,
} from './install.utils';

/**
 * What can be offered about installing the app here.
 *
 * Chrome, on Android and on a computer, fires `beforeinstallprompt` when it would install
 * the page; kept from the moment the app loads (`install.utils.ts`), it lets the app open
 * the browser's own prompt from its own button. Safari on an iPhone never fires it, and
 * the only way is its Share menu, so the app explains that instead. Running installed
 * already, there is nothing to offer.
 */
export function useInstallOffer(): InstallOfferState {
  const kept = useSyncExternalStore(onInstallEvent, keptInstallEvent);
  const [dismissed, setDismissed] = useState(hintDismissed);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const done = () => setInstalled(true);

    window.addEventListener('appinstalled', done);

    return () => {
      window.removeEventListener('appinstalled', done);
    };
  }, []);

  if (installed) {
    return { kind: 'installed' };
  }

  if (kept !== null) {
    return { kind: 'prompt', install: promptToInstall };
  }

  if (!dismissed && isIos(window.navigator.userAgent, window.navigator.maxTouchPoints)) {
    return {
      kind: 'ios-hint',
      dismiss: () => {
        dismissHint();
        setDismissed(true);
      },
    };
  }

  return { kind: 'none' };
}
