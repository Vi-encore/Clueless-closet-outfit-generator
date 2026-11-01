import { useEffect, useRef, useState, type SubmitEvent } from 'react';
import { useLocation, useParams } from 'react-router';
import { hasStatus } from '../api/api-error';
import type { ShownMessage } from '../chat/chat.interfaces';
import { useConversation } from '../chat/use-conversation';
import { uk } from '../i18n/uk';
import { Window } from '../shell/window';
import { NotFound } from './not-found';

/** Keyed by person, so that going from one conversation to another starts clean. */
export function Conversation() {
  const { username = '' } = useParams();

  return <ConversationWindow key={username} username={username} />;
}

function ConversationWindow({ username }: { username: string }) {
  const { state } = useLocation();
  // The name the previous screen knew, or the address's where there was none.
  const name = (state as { name?: string } | null)?.name ?? username;
  const { messages, senderId, loaded, error, lost, hasEarlier, loadEarlier, send, retry } =
    useConversation(username);
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
        <form className="flex items-end gap-2" onSubmit={submit}>
          <div className="field-row-stacked flex-1">
            <label htmlFor="message-draft">{uk.chat.message}</label>
            <input
              id="message-draft"
              type="text"
              autoComplete="off"
              maxLength={4000}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </div>
          <button type="submit" className="action">
            {uk.chat.send}
          </button>
        </form>
      </div>
    </Window>
  );
}

interface BubbleProps {
  message: ShownMessage;
  mine: boolean;
  onRetry: () => void;
}

function Bubble({ message, mine, onRetry }: BubbleProps) {
  return (
    <li className={mine ? 'bubble bubble-mine' : 'bubble'}>
      {message.body}
      {message.state === 'waiting' && <small>{uk.chat.sending}</small>}
      {message.state === 'failed' && (
        <small>
          {uk.chat.notSent}{' '}
          <button type="button" onClick={onRetry}>
            {uk.chat.tryAgain}
          </button>
        </small>
      )}
    </li>
  );
}
