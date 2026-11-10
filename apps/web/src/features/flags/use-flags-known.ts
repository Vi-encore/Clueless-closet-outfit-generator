import { useQuery } from '@tanstack/react-query';
import { flagsQuery } from './flags.queries';

/**
 * Whether the deployment's flags have been heard, or will not be: false only while the
 * answer is on its way, so that a step a flag decides can wait for it. A failed request
 * counts as known, and every flag then stays at its default.
 */
export function useFlagsKnown(): boolean {
  return !useQuery(flagsQuery()).isPending;
}
