import { FLAG_DEFAULTS, type FlagName } from '@closet/core';
import { useQuery } from '@tanstack/react-query';
import { flagsQuery } from './flags.queries';

/**
 * Whether a feature flag is on, as the deployment set it.
 *
 * Its default from `@closet/core` until the answer arrives, and for good if it never
 * does: flags that cannot be read must not break a screen. A flag that guards a whole
 * screen and defaults to on may want to wait for the answer instead; none does yet.
 */
export function useFlag(name: FlagName): boolean {
  const { data } = useQuery(flagsQuery());

  return data?.[name] ?? FLAG_DEFAULTS[name];
}
