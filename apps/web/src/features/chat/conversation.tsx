import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { useLocation, useParams } from 'react-router';
import { hasStatus } from '../../shared/api/api-error';
import type { ConversationWindowProps } from './chat.interfaces';
import { Bubble } from './bubble';
import { useConversation } from './use-conversation';
import { useSession } from '../session';
import { uk } from '../../shared/i18n/uk';
import { Window } from '../../shared/ui/window';
import { NotFound } from '../../shared/ui/not-found';
import type { NamedState } from '../../shared/ui/ui.interfaces';

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

function ConversationWindow({ username }: ConversationWindowProps) {
  const { state } = useLocation();
  // The name the previous screen knew, or the address's where there was none.
  const name = (state as NamedState | null)?.name ?? username;
  const {
    messages,
    senderId,
    loaded,
    error,
    lost,
    hasEarlier,
    closed,
    theyAreTyping,
    loadEarlier,
    announceTyping,
    send,
    retry,
  } = useConversation(username);
  const [draft, setDraft] = useState('');
  const list = useRef<HTMLOListElement>(null);
  const newest = messages.at(-1)?.id;

  // To the newest when a new one arrives, and not when earlier ones are added above it.
  useEffect(() => {
    if (list.current !== null) {
      list.current.scrollTop = list.current.scrollHeight;
    }
  }, [newest]);

  if (hasStatus(error, 404)) {
    return <NotFound />;
  }

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (draft.trim() !== '') {
      send(draft.trim());
      setDraft('');
    }
  };

  return (
    <Window title={name} parent="/chat" wide fills>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        {error !== null && <p role="alert">{uk.errors.unavailable}</p>}
        {lost && <output className="block">{uk.chat.lost}</output>}
        {hasEarlier && (
          <button type="button" className="self-center" onClick={loadEarlier}>
            {uk.chat.earlier}
          </button>
        )}
        {loaded && messages.length === 0 && <p>{uk.chat.nothingYet}</p>}
        <ol ref={list} aria-label={name} className="messages">
          {messages.map((message) => (
            <Bubble
              key={message.id}
              message={message}
              mine={message.senderId === senderId}
              onRetry={() => retry(message)}
            />
          ))}
        </ol>
        {/* Always in the layout, so that the list does not jump when it comes and goes. */}
        <p className="h-5 text-sm">{theyAreTyping && uk.chat.typing(name)}</p>
        {closed !== null && <p>{closed === 'blocked' ? uk.chat.blocked : uk.chat.formerFriend}</p>}
        {loaded && closed === null && (
          <form className="flex items-end gap-2" onSubmit={submit}>
            <div className="field-row-stacked flex-1">
              <label htmlFor="message-draft">{uk.chat.message}</label>
              <input
                id="message-draft"
                type="text"
                autoComplete="off"
                maxLength={4000}
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value);

                  if (event.target.value !== '') {
                    announceTyping();
                  }
                }}
              />
            </div>
            <button type="submit" className="action">
              {uk.chat.send}
            </button>
          </form>
        )}
      </div>
    </Window>
  );
}
