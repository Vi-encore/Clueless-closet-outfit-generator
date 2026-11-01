import { io } from 'socket.io-client';
import { API_URL } from '../config';
import type { OutgoingMessage, SendAck } from '../api/api.interfaces';
import { getAccessToken } from './token-store';

export interface ChatHandlers {
  /** The connection is up, for the first time or after a drop. */
  onConnected: () => void;
  /** It went away, and Socket.IO is trying to bring it back by itself. */
  onDisconnected: () => void;
  /**
   * The server refused the handshake, and nothing will try again by itself. Socket.IO
   * reconnects after a dropped line, because that is worth retrying. A refusal is an
   * answer, so it stops, and what happens next is the caller's decision.
   */
  onRefused: () => void;
  /** A message arrived, for any conversation this person is in. */
  onMessage: () => void;
}

/** How long to wait for the gateway's answer before calling a message failed. */
const ACK_TIMEOUT = 5000;

export interface ChatConnection {
  /** Sends a message and answers with the gateway's acknowledgement, or rejects in time. */
  send: (message: OutgoingMessage) => Promise<SendAck>;
  /** Tries again after `onRefused`, reading the token afresh. */
  reconnect: () => void;
  close: () => void;
}

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
  const socket = io(API_URL, {
    auth: (send) => send({ token: getAccessToken() }),
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', handlers.onConnected);
  socket.on('disconnect', handlers.onDisconnected);
  socket.on('message', handlers.onMessage);
  socket.on('connect_error', () => {
    // `active` is the difference between the two kinds of failure: true while Socket.IO
    // means to retry a line that dropped, false when the server said no.
    if (!socket.active) {
      handlers.onRefused();
    }
  });

  return {
    send: (message) => socket.timeout(ACK_TIMEOUT).emitWithAck('message:send', message),
    reconnect: () => {
      socket.connect();
    },
    close: () => {
      socket.disconnect();
    },
  };
}
