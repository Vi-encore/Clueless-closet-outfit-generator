import { FLAG_DEFAULTS, type FlagName, type Flags } from '@closet/core';

/** Every flag's value: its default, then the settings' "on" list, then their "off" list. */
export function flagsFrom(on: readonly FlagName[], off: readonly FlagName[]): Flags {
  const flags: Flags = { ...FLAG_DEFAULTS };

  for (const name of on) {
    flags[name] = true;
  }

  for (const name of off) {
    flags[name] = false;
  }

  return flags;
}
