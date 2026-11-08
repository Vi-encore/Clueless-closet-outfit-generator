import { uk } from '../../shared/i18n/uk';
import type { UnreadBadgeProps } from './chat.interfaces';

/** How many are waiting, and nothing at all when none are. */
export function UnreadBadge({ count }: UnreadBadgeProps) {
  return count > 0 ? (
    <span className="badge" aria-label={uk.chat.unread(count)}>
      {count}
    </span>
  ) : null;
}
