import type { CountBadgeProps } from './ui.interfaces';

/**
 * How many are waiting, and nothing at all when none are: unread messages, requests. The
 * number is what a person sees; `label` says what it counts, for whoever cannot see it.
 */
export function CountBadge({ count, label }: CountBadgeProps) {
  return count > 0 ? (
    <span className="badge" aria-label={label(count)}>
      {count}
    </span>
  ) : null;
}
