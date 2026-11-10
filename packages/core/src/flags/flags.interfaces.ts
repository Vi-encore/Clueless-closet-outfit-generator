import type { FLAG_DEFAULTS } from './flags.constants.js';

/** The name of a feature flag. */
export type FlagName = keyof typeof FLAG_DEFAULTS;

/** Every flag and whether it is on: what `GET /flags` answers with. */
export type Flags = Record<FlagName, boolean>;
