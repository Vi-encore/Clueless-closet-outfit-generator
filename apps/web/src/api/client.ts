import { API_URL } from '../config';
import { getAccessToken, setAccessToken } from '../platform/token-store';
import { ApiError, hasStatus } from './api-error';
import type { RequestOptions } from './api.interfaces';

const sessionLostListeners = new Set<() => void>();

/** The renewal under way, which everything needing one waits on. */
let renewal: Promise<void> | null = null;

/**
 * Tells the listener when the session has ended without anybody asking it to. Exists
 * because this module knows when that happens and is not a React thing; the session
 * context subscribes. Returns the way to stop listening.
 */
export function onSessionLost(listener: () => void): () => void {
  sessionLostListeners.add(listener);

  return () => {
    sessionLostListeners.delete(listener);
  };
}

/**
 * One request, once, with no opinion about the answer.
 *
 * `credentials: 'include'` is not only for the refresh: without it a browser also
 * throws away the cookie in a cross-origin response, so signing in would appear to
 * work and then have nothing to refresh with.
 */
async function send(path: string, { method = 'GET', body }: RequestOptions): Promise<Response> {
  const token = getAccessToken();
  const headers = new Headers();

  if (token !== null) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${API_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? null : JSON.stringify(body),
  });
}

async function parsed<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ApiError(response.status);
  }

  // A 204 has nothing to parse, and `json()` would throw on the empty body.
  return (response.status === 204 ? undefined : await response.json()) as T;
}

/**
 * A request whose 401 means what it says, and is not an expired token: a wrong password
 * at sign-in, say. Everything that takes no access token comes through here.
 */
export async function publicRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return parsed<T>(await send(path, options));
}

/**
 * Exchanges the refresh cookie for a new access token.
 *
 * Only ever one at a time, and that is not an optimisation. Refreshing retires the token
 * it was given, so three screens each refreshing would leave two of them holding a spent
 * cookie and a 401, and a successful operation would end the session. The start of the
 * application goes through here too, because `StrictMode` runs that effect twice.
 */
export function renewAccessToken(): Promise<void> {
  renewal ??= publicRequest<{ accessToken: string }>('/auth/refresh', { method: 'POST' })
    .then(({ accessToken }) => {
      setAccessToken(accessToken);
    })
    .finally(() => {
      renewal = null;
    });

  return renewal;
}

/**
 * A request as a signed-in person, surviving the access token's expiry.
 *
 * A 401 refreshes once and sends the request again. Only a 401 from the refresh ends the
 * session: a 429 or a server having a bad minute says nothing about the cookie, and
 * signing somebody out over one would throw away a session that is perfectly good.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const sentWith = getAccessToken();
  const response = await send(path, options);

  if (response.status !== 401) {
    return parsed<T>(response);
  }

  // A different token by now means somebody else's renewal finished while this request
  // was on its way back. It only needs sending again, and a second renewal would be waste.
  if (getAccessToken() === sentWith) {
    try {
      await renewAccessToken();
    } catch (error) {
      if (hasStatus(error, 401)) {
        loseSession();
      }

      throw error;
    }
  }

  return parsed<T>(await send(path, options));
}

function loseSession(): void {
  setAccessToken(null);

  for (const listener of sessionLostListeners) {
    listener();
  }
}
