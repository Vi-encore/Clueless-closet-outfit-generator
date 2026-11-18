/** What a person answered in the browser's own install prompt. */
export interface InstallChoice {
  outcome: 'accepted' | 'dismissed';
  platform: string;
}

/**
 * Chrome's `beforeinstallprompt`, which TypeScript's DOM types do not know: an event to
 * keep, whose prompt can be opened later, once, from a person's press.
 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
}

/** Safari's own flag for a page running as an app from the home screen. */
export interface IosNavigator extends Navigator {
  standalone?: boolean;
}

/** What the desktop can offer about installing, if anything. */
export type InstallOfferState =
  | { kind: 'none' }
  | { kind: 'installed' }
  | { kind: 'prompt'; install: () => void }
  | { kind: 'ios-hint'; dismiss: () => void };
