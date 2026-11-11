import type { FlagName } from './flags.interfaces.js';

/**
 * Every feature flag there is, and what it is when a deployment says nothing about it.
 *
 * A flag is a switch a deployment turns without a change to the code: a heavy piece that
 * may need to go quiet on some phones, or unfinished work that is in the code but not yet
 * for people. Both apps read this list, so a flag that is not here cannot be named.
 */
export const FLAG_DEFAULTS = {
  /** Cutting a new item's background out in the browser, which downloads a model first. */
  photoCutout: true,
} satisfies Record<string, boolean>;

/** The flags' names, for checking a setting that lists some of them. */
export const FLAG_NAMES = Object.keys(FLAG_DEFAULTS) as FlagName[];
