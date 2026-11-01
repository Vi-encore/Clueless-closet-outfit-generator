import { uk } from '../i18n/uk';

/** How many are waiting, and nothing at all when none are. */
export function UnreadBadge({ count }: { count: number }) {
  return count > 0 ? (
    <span className="badge" aria-label={uk.chat.unread(count)}>
      {count}
    </span>
  ) : null;
}
