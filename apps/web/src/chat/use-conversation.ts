import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from '../api/api.interfaces';
import { findPerson, listMessages, listMessagesAfter, markRead } from '../api/chat';
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
  const { send: sendOnSocket, refresh, subscribe, status } = useChat();
  const { state } = useSession();
  const senderId = state.status === 'signed-in' ? state.account.id : '';
  const [messages, setMessages] = useState<ShownMessage[]>([]);
  const [earlierCursor, setEarlierCursor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<unknown>(null);
  // Refs, because the listener below is subscribed once and has to see the latest of each.
  const otherId = useRef<string | null>(null);
  const conversationId = useRef<string | null>(null);
  const lastSettled = useRef<string | null>(null);

  const show = useCallback((incoming: ShownMessage[]) => {
    setMessages((shown) => {
      const merged = mergeMessages(shown, incoming);
      const newest = merged.findLast(({ state: progress }) => progress === 'sent');

      lastSettled.current = newest?.id ?? null;
      conversationId.current = newest?.conversationId ?? conversationId.current;

      return merged;
    });
  }, []);

  // Bookkeeping: a failure here must not stop anybody reading. Only while a person can
  // really see the page, or a tab left open would read everything for them.
  const read = useCallback(() => {
    if (document.visibilityState === 'visible') {
      markRead(username).then(refresh, () => {});
    }
  }, [username, refresh]);

  // What arrived while nobody was looking is read the moment somebody looks.
  useEffect(() => {
    document.addEventListener('visibilitychange', read);

    return () => {
      document.removeEventListener('visibilitychange', read);
    };
  }, [read]);

  useEffect(() => {
    let current = true;

    Promise.all([listMessages(username), findPerson(username)]).then(
      ([{ items, nextCursor }, person]) => {
        if (!current) {
          return;
        }

        otherId.current = person.id;
        show(items.map(settled));
        setEarlierCursor(nextCursor);
        setLoaded(true);
        read();
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
  }, [username, show, read]);

  useEffect(() => {
    // Page after page: somebody back after a long absence can have missed more than one.
    const catchUp = async () => {
      const after = lastSettled.current;

      if (after === null) {
        const { items } = await listMessages(username);

        show(items.map(settled));

        return;
      }

      let cursor = after;

      for (;;) {
        const { items, nextCursor } = await listMessagesAfter(username, cursor);

        show(items.map(settled));

        if (nextCursor === null) {
          break;
        }

        cursor = nextCursor;
      }
    };

    return subscribe((event) => {
      if (event.type === 'reconnected') {
        catchUp().then(read, () => {});

        return;
      }

      const { message } = event;

      // A message from them, or anything in this conversation, which is how the person's
      // own words reach this screen from their other device. Everything goes through
      // `show`, so one already here, by the acknowledgement say, stays one.
      if (
        message.senderId === otherId.current ||
        message.conversationId === conversationId.current
      ) {
        show([settled(message)]);
        read();
      }
    });
  }, [username, subscribe, show, read]);

  const loadEarlier = () => {
    if (earlierCursor === null) {
      return;
    }

    listMessages(username, earlierCursor).then(
      ({ items, nextCursor }) => {
        show(items.map(settled));
        setEarlierCursor(nextCursor);
      },
      () => {},
    );
  };

  const deliver = useCallback(
    (message: ShownMessage) => {
      sendOnSocket({ id: message.id, to: username, body: message.body }).then(
        (answer) => {
          show([answer.ok ? settled(answer.message) : { ...message, state: 'failed' }]);
        },
        // No answer in time. Whether it arrived is unknown, which the id makes harmless.
        () => show([{ ...message, state: 'failed' }]),
      );
    },
    [sendOnSocket, username, show],
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

    show([message]);
    deliver(message);
  };

  const retry = (message: ShownMessage) => {
    const again: ShownMessage = { ...message, state: 'waiting' };

    show([again]);
    deliver(again);
  };

  return {
    messages,
    senderId,
    loaded,
    error,
    lost: status === 'lost',
    hasEarlier: earlierCursor !== null,
    loadEarlier,
    send,
    retry,
  };
}
