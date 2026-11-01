import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { hasStatus } from '../api/api-error';
import type { Conversation, OutgoingMessage } from '../api/api.interfaces';
import { listConversations } from '../api/chat';
import { endSession, renewAccessToken } from '../api/client';
import { connectChat, type ChatConnection } from '../platform/chat-socket';
import { useSession } from '../session/use-session';
import { ChatContext } from './chat.context';
import type { Chat, ChatEvent, ChatListener, ChatStatus } from './chat.interfaces';

/**
 * One connection, for as long as there is a session.
 *
 * It lives here rather than in a screen because leaving a screen must not stop messages
 * arriving, and because two screens must not mean two connections. The effect closes what
 * it opened, which is also what keeps `StrictMode`'s second run from leaving a developer
 * with two sockets and every message twice.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const { state } = useSession();
  const signedIn = state.status === 'signed-in';
  const [line, setLine] = useState<ChatStatus>('connecting');
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [failed, setFailed] = useState(false);
  const asked = useRef(0);
  const open = useRef<ChatConnection | null>(null);
  const listeners = useRef(new Set<ChatListener>());

  // Asked again rather than counted here, for the reason the friends screen does: which
  // conversation moved, and how far, are the API's rules. Each answer is numbered, so that
  // two messages close together cannot leave the older list on screen.
  const refresh = useCallback(() => {
    asked.current += 1;
    const question = asked.current;

    listConversations().then(
      (list) => {
        if (question === asked.current) {
          setConversations(list);
          setFailed(false);
        }
      },
      () => {
        if (question === asked.current) {
          setFailed(true);
        }
      },
    );
  }, []);

  const tell = useCallback((event: ChatEvent) => {
    for (const listener of listeners.current) {
      listener(event);
    }
  }, []);

  useEffect(() => {
    if (!signedIn) {
      return;
    }

    // One renewal per refusal: if a fresh token is refused too, asking again would loop
    // for ever, and something other than the token is wrong.
    let renewed = false;
    // The first connection is the start. Any later one is a line coming back, and whoever
    // is looking at a conversation has to go and ask what they missed.
    let connectedBefore = false;
    // A renewal can still be on its way when the session ends, and connecting after that
    // would leave a socket open with nobody signed in.
    let closed = false;

    const connection = connectChat({
      onConnected: () => {
        renewed = false;
        setLine('connected');
        // After a drop as well as at the start: anything could have arrived meanwhile.
        refresh();

        if (connectedBefore) {
          tell({ type: 'reconnected' });
        }

        connectedBefore = true;
      },
      onMessage: (message) => {
        refresh();
        tell({ type: 'message', message });
      },
      onDisconnected: () => setLine('lost'),
      onRefused: () => {
        if (renewed) {
          setLine('lost');

          return;
        }

        renewed = true;
        // The handshake is the only place a socket shows its token, so this is where an
        // expired one surfaces: after a laptop slept, say. Same single renewal as HTTP.
        renewAccessToken().then(
          () => {
            if (!closed) {
              connection.reconnect();
            }
          },
          (error: unknown) => {
            setLine('lost');

            if (hasStatus(error, 401)) {
              endSession();
            }
          },
        );
      },
    });

    open.current = connection;

    return () => {
      closed = true;
      open.current = null;
      connection.close();
      setLine('connecting');
      asked.current += 1;
      setConversations(null);
    };
  }, [signedIn, refresh, tell]);

  // Derived, so that there is no moment after signing out with a line said to be up.
  const status: ChatStatus = signedIn ? line : 'offline';
  const send = useCallback((message: OutgoingMessage) => {
    return open.current === null
      ? Promise.reject(new Error('There is no connection'))
      : open.current.send(message);
  }, []);

  const subscribe = useCallback((listener: ChatListener) => {
    listeners.current.add(listener);

    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const chat = useMemo<Chat>(
    () => ({
      status,
      conversations,
      failed,
      unreadTotal: conversations?.reduce((total, { unread }) => total + unread, 0) ?? 0,
      send,
      refresh,
      subscribe,
    }),
    [status, conversations, failed, send, refresh, subscribe],
  );

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}
