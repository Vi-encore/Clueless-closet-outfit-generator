import message from 'pixelarticons/svg/message.svg';
import shirt from 'pixelarticons/svg/shirt.svg';
import users from 'pixelarticons/svg/users.svg';
import { Link } from 'react-router';
import { useChat } from '../chat/use-chat';
import { uk } from '../i18n/uk';
import { UnreadBadge } from '../shell/unread-badge';
import { Window } from '../shell/window';

const SHORTCUTS = [
  { to: '/wardrobe', icon: shirt, label: uk.wardrobe.title },
  { to: '/friends', icon: users, label: uk.friends.title },
  { to: '/chat', icon: message, label: uk.chat.title },
];

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
