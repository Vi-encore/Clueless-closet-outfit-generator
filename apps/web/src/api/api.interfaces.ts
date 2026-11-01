/** What the API says about an account: `AccountView` on its side. */
export interface Account {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration extends Credentials {
  username: string;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Sent as JSON. */
  body?: unknown;
}
