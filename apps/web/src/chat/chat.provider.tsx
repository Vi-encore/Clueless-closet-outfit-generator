import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { hasStatus } from '../api/api-error';
import { endSession, renewAccessToken } from '../api/client';
import { connectChat } from '../platform/chat-socket';
import { useSession } from '../session/use-session';
import { ChatContext } from './chat.context';
import type { Chat, ChatStatus } from './chat.interfaces';

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

  useEffect(() => {
    if (!signedIn) {
      return;
    }

    // One renewal per refusal: if a fresh token is refused too, asking again would loop
    // for ever, and something other than the token is wrong.
    let renewed = false;
    // A renewal can still be on its way when the session ends, and connecting after that
    // would leave a socket open with nobody signed in.
    let closed = false;

    const connection = connectChat({
      onConnected: () => {
        renewed = false;
        setLine('connected');
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

    return () => {
      closed = true;
      connection.close();
      setLine('connecting');
    };
  }, [signedIn]);

  // Derived, so that there is no moment after signing out with a line said to be up.
  const status: ChatStatus = signedIn ? line : 'offline';
  const chat = useMemo<Chat>(() => ({ status }), [status]);

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}
