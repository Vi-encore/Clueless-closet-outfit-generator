import type { Message, ShownMessage, SocketAddress } from './chat.interfaces';

/** A message as stored, shown as one that has arrived. */
export const settled = (message: Message): ShownMessage => ({ ...message, state: 'sent' });

/**
 * Where the chat's connection goes, for an API at this address.
 *
 * An absolute address is the server, on Socket.IO's own path. A relative one, such as the
 * phone mode's `/api`, is this page's origin with the path under it: given to `io` as a
 * URL it would be read as a namespace on this host, and the proxy would never see it.
 */
export function socketAddress(apiUrl: string): SocketAddress {
  return apiUrl.startsWith('/')
    ? { url: undefined, path: `${apiUrl}/socket.io` }
    : { url: apiUrl, path: '/socket.io' };
}
