/** Somebody else, as the API describes them to anybody. */
export interface Person {
  id: string;
  username: string;
  displayName: string | null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Sent as JSON. */
  body?: unknown;
}

/** What signing in and refreshing answer with. The refresh token travels as a cookie. */
export interface IssuedAccessToken {
  accessToken: string;
}
