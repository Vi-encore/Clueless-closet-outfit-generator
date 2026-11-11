import { Link } from 'react-router';
import { UnreadBadge, useChat } from '../chat';
import { uk } from '../../shared/i18n/uk';
import { Window } from '../../shared/ui/window';
import { SHORTCUTS } from './desktop.constants';

/** Where signing in lands: the places a person can go, as things to press. */
export function Desktop() {
  const { unreadTotal } = useChat();

  return (
    <Window title={uk.desktop.title} closable={false}>
      <p>{uk.desktop.welcome}</p>
      <nav aria-label={uk.desktop.title} className="mt-4 flex flex-wrap gap-4">
        {SHORTCUTS.map(({ to, icon, label }) => (
          <Link key={to} to={to} className="shortcut">
            {/* Empty alt: the label beside it already says what this is. */}
            <img src={icon} alt="" width={48} height={48} />
            {label}
            {to === '/chat' && <UnreadBadge count={unreadTotal} />}
          </Link>
        ))}
      </nav>
    </Window>
  );
}
