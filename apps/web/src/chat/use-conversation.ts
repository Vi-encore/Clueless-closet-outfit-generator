import { useCallback, useEffect, useState } from 'react';
import type { Message } from '../api/api.interfaces';
import { listMessages, markRead } from '../api/chat';
import { useSession } from '../session/use-session';
import type { ShownMessage } from './chat.interfaces';
import { mergeMessages } from './merge-messages';
import { useChat } from './use-chat';

const settled = (message: Message): ShownMessage => ({ ...message, state: 'sent' });

/**
 * One conversation: what is on screen, and how a message gets there.
 *
 * A message has two lives. It appears the moment it is sent, as `waiting`, under an id
 * made here, so that a person sees their words at once. It settles when the gateway
 * acknowledges it, and the acknowledgement replaces it with the stored version, which has
 * the server's time. No answer, or a refusal, leaves it `failed`, and sending it again
 * reuses the id: if it did arrive and only the answer was lost, the server recognises the
 * id and answers with what it stored, so nobody gets the message twice.
 */
export function useConversation(username: string) {
  const { send: sendOnSocket, refresh } = useChat();
  const { state } = useSession();
  const senderId = state.status === 'signed-in' ? state.account.id : '';
  const [messages, setMessages] = useState<ShownMessage[]>([]);
  const [earlierCursor, setEarlierCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let current = true;

    listMessages(username).then(
      ({ items, nextCursor }) => {
        if (!current) {
          return;
        }

        setMessages((shown) => mergeMessages(shown, items.map(settled)));
        setEarlierCursor(nextCursor);
        setLoaded(true);
        // Bookkeeping: a failure here must not stop anybody reading.
        markRead(username).then(refresh, () => {});
      },
      (failure: unknown) => {
        if (current) {
          setError(failure);
        }
      },
    );

    return () => {
      current = false;
    };
  }, [username, refresh]);

  const loadEarlier = () => {
    if (earlierCursor === null) {
      return;
    }

    listMessages(username, earlierCursor).then(
      ({ items, nextCursor }) => {
        setMessages((shown) => mergeMessages(shown, items.map(settled)));
        setEarlierCursor(nextCursor);
      },
      () => {},
    );
  };

  const deliver = useCallback(
    (message: ShownMessage) => {
      sendOnSocket({ id: message.id, to: username, body: message.body }).then(
        (answer) => {
          setMessages((shown) =>
            answer.ok
              ? mergeMessages(shown, [settled(answer.message)])
              : mergeMessages(shown, [{ ...message, state: 'failed' }]),
          );
        },
        // No answer in time. Whether it arrived is unknown, which the id makes harmless.
        () => {
          setMessages((shown) => mergeMessages(shown, [{ ...message, state: 'failed' }]));
        },
      );
    },
    [sendOnSocket, username],
  );

  const send = (body: string) => {
    const message: ShownMessage = {
      id: crypto.randomUUID(),
      conversationId: '',
      senderId,
      body,
      createdAt: new Date().toISOString(),
      state: 'waiting',
    };

    setMessages((shown) => mergeMessages(shown, [message]));
    deliver(message);
  };

  const retry = (message: ShownMessage) => {
    const again: ShownMessage = { ...message, state: 'waiting' };

    setMessages((shown) => mergeMessages(shown, [again]));
    deliver(again);
  };

  return {
    messages,
    senderId,
    loaded,
    error,
    hasEarlier: earlierCursor !== null,
    loadEarlier,
    send,
    retry,
  };
}
