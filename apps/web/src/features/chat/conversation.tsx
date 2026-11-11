import { useParams } from 'react-router';
import { useSession } from '../session';
import { NotFound } from '../../shared/ui/not-found';
import { ConversationWindow } from './conversation-window';

/** Keyed by person, so that going from one conversation to another starts clean. */
export function Conversation() {
  const { username = '' } = useParams();
  const { state } = useSession();

  // Nobody has a conversation with themselves, and the API answers their own name with
  // 404. Known here already, so the window that would ask is never mounted.
  if (state.status === 'signed-in' && state.account.username === username) {
    return <NotFound />;
  }

  return <ConversationWindow key={username} username={username} />;
}
