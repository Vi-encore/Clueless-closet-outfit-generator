/**
 * The access token, in memory and nowhere else.
 *
 * Not `localStorage`: that is readable by anything that gets onto the page, including
 * through a dependency, and this application holds photographs of its users. The price
 * is that a reload forgets the token, which is why the application asks the API whether
 * there is still a session every time it starts.
 *
 * Deliberately not a React thing, since the API client needs it too. It is also the one
 * seam a native shell moves: `docs/architecture.md` lists it with the other platform
 * wrappers.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
