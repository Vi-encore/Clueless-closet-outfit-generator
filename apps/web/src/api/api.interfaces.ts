import type { ItemStatus, ItemType, Slot, Visibility } from '@closet/core';

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

/** The part of an item the screens read. The API answers with every column. */
export interface Item {
  id: string;
  name: string | null;
  slot: Slot;
  type: ItemType;
  visibility: Visibility;
  status: ItemStatus;
  /** Short-lived, and carries its own authorisation. Null when there is no photo. */
  photoUrl: string | null;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Sent as JSON. */
  body?: unknown;
}
