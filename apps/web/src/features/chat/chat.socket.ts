import { io } from 'socket.io-client';
import { API_URL } from '../../shared/config';
import { socketAddress } from './chat.utils';
import type { ChatConnection, ChatHandlers, TypingNotice } from './chat.interfaces';
import { getAccessToken } from '../../shared/api/token-store';

/** How long to wait for the gateway's answer before calling a message failed. */
const ACK_TIMEOUT = 5000;

/**
 * The socket, and nothing about screens. A native shell would keep this seam.
 *
 * A function for `auth` rather than a value, because it runs on every attempt: a
 * reconnection in the afternoon has to use the token of the afternoon and not the one
 * from when this was opened. The token is only ever looked at during this handshake, so
 * a connection already open outlives it. That is safe because the server checks
 * friendship on every message rather than trusting the connection.
 *
 * WebSocket first, because it is what this will end up on anyway, and polling behind it
 * for a network that refuses one.
 */
export function connectChat(handlers: ChatHandlers): ChatConnection {
  const { url, path } = socketAddress(API_URL);
  const socket = io(url, {
    path,
    auth: (send) => send({ token: getAccessToken() }),
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', handlers.onConnected);
  socket.on('disconnect', handlers.onDisconnected);
  socket.on('message', handlers.onMessage);
  socket.on('typing', ({ username }: TypingNotice) => handlers.onTyping(username));
  socket.on('connect_error', () => {
    // `active` is the difference between the two kinds of failure: true while Socket.IO
    // means to retry a line that dropped, false when the server said no.
    if (!socket.active) {
      handlers.onRefused();
    }
  });

  return {
    send: (message) => socket.timeout(ACK_TIMEOUT).emitWithAck('message:send', message),
    // `volatile`: dropped rather than queued while the line is down. "Typing" from two
    // minutes ago, delivered on reconnecting, would be a small lie.
    typing: (to) => {
      socket.volatile.emit('typing', { to });
    },
    reconnect: () => {
      socket.connect();
    },
    close: () => {
      socket.disconnect();
    },
  };
}
