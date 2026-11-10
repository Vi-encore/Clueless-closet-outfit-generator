import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hasStatus } from '../../shared/api/api-error';
import type { ChatConnection, ChatProviderProps, OutgoingMessage } from './chat.interfaces';
import { conversationKeys } from './chat.constants';
import { conversationsQuery } from './chat.queries';
import { endSession, renewAccessToken } from '../../shared/api/client';
import { connectChat } from './chat.socket';
import { useSession } from '../session';
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
export function ChatProvider({ children }: ChatProviderProps) {
  const { state } = useSession();
  const signedIn = state.status === 'signed-in';
  const [line, setLine] = useState<ChatStatus>('connecting');
  const queryClient = useQueryClient();
  const list = useQuery({ ...conversationsQuery(), enabled: signedIn });
  const open = useRef<ChatConnection | null>(null);
  const listeners = useRef(new Set<ChatListener>());

  // Asked again rather than counted here, for the reason the friends screen does: which
  // conversation moved, and how far, are the API's rules. The cache drops an answer that a
  // later question has overtaken, so two messages close together cannot leave the older
  // list on screen.
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: conversationKeys.all });
  }, [queryClient]);

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
      onTyping: (username) => tell({ type: 'typing', username }),
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
    };
  }, [signedIn, refresh, tell]);

  // Derived, so that there is no moment after signing out with a line said to be up.
  const status: ChatStatus = signedIn ? line : 'offline';
  const send = useCallback((message: OutgoingMessage) => {
    return open.current === null
      ? Promise.reject(new Error('There is no connection'))
      : open.current.send(message);
  }, []);

  const typing = useCallback((to: string) => open.current?.typing(to), []);

  const subscribe = useCallback((listener: ChatListener) => {
    listeners.current.add(listener);

    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  // Nothing is shown for somebody signed out, even for the moment before the cache empties.
  const conversations = signedIn ? (list.data ?? null) : null;
  const failed = signedIn && list.isError;

  const chat = useMemo<Chat>(
    () => ({
      status,
      conversations,
      failed,
      unreadTotal: conversations?.reduce((total, { unread }) => total + unread, 0) ?? 0,
      send,
      typing,
      refresh,
      subscribe,
    }),
    [status, conversations, failed, send, typing, refresh, subscribe],
  );

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}
