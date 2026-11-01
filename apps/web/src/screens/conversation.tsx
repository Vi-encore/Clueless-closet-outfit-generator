import { useLocation, useParams } from 'react-router';
import { Window } from '../shell/window';

/** One conversation, addressed by person: its id is bookkeeping the API keeps to itself. */
export function Conversation() {
  const { username = '' } = useParams();
  const { state } = useLocation();
  // The name the previous screen knew, or the address's where there was none.
  const name = (state as { name?: string } | null)?.name ?? username;

  return <Window title={name} parent="/chat" wide />;
}
