import { Link } from 'react-router';
import { useChat } from './use-chat';
import { uk } from '../../shared/i18n/uk';
import { personName } from '../../shared/person-name';
import { UnreadBadge } from './unread-badge';
import { Window } from '../../shared/ui/window';

/** Who a person has talked to, most recent first, as the API already orders them. */
export function Chat() {
  const { conversations, failed } = useChat();

  return (
    <Window title={uk.chat.title} parent="/" wide>
      {failed && <p role="alert">{uk.errors.unavailable}</p>}
      {conversations?.length === 0 && <p>{uk.chat.none}</p>}

      {conversations !== null && conversations.length > 0 && (
        <ul className="flex flex-col gap-2">
          {conversations.map(({ id, user, unread }) => (
            <li key={id} className="sheet">
              <Link
                to={`/chat/${user.username}`}
                state={{ name: personName(user) }}
                className="person-link flex items-center justify-between gap-2"
              >
                {personName(user)}
                <UnreadBadge count={unread} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Window>
  );
}
