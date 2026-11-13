import { Link } from 'react-router';
import { useChat } from '../chat';
import { useWaitingRequestCount } from '../friends';
import { CountBadge } from '../../shared/ui/count-badge';
import { uk } from '../../shared/i18n/uk';
import { Window } from '../../shared/ui/window';
import { SHORTCUTS } from './desktop.constants';

/** Where signing in lands: the places a person can go, as things to press. */
export function Desktop() {
  const { unreadTotal } = useChat();
  const waiting = useWaitingRequestCount();

  return (
    <Window title={uk.desktop.title} closable={false}>
      <p>{uk.desktop.welcome}</p>
      <nav
        aria-label={uk.desktop.title}
        className="mt-4 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap"
      >
        {SHORTCUTS.map(({ to, icon, label }) => (
          <Link key={to} to={to} className="shortcut">
            {/* Empty alt: the label beside it already says what this is. */}
            <img src={icon} alt="" width={48} height={48} />
            {label}
            {to === '/chat' && <CountBadge count={unreadTotal} label={uk.chat.unread} />}
            {to === '/friends' && <CountBadge count={waiting} label={uk.friends.waitingCount} />}
          </Link>
        ))}
      </nav>
    </Window>
  );
}
