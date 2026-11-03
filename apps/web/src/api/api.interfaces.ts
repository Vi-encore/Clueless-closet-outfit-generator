import type { ItemStatus, ItemType, Slot, Visibility } from '@closet/core';
import type { Person } from '../shared/api/api.interfaces';

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

/** One relation, as seen by whoever asked. */
export interface Relation {
  user: Person;
  status: 'pending' | 'accepted' | 'blocked';
  requestedByMe: boolean;
}

/** One conversation, described by who is on the other side of it. */
export interface Conversation {
  id: string;
  user: Person;
  lastMessageAt: string | null;
  unread: number;
}

/** A message, as stored. Times are strings: `Date` does not survive JSON. */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  createdAt: string;
}

/** A message on its way out. The id is made by the client, so that a retry is safe. */
export interface OutgoingMessage {
  id: string;
  to: string;
  body: string;
}

/** What the gateway answers a `message:send` with. */
export type SendAck = { ok: true; message: Message } | { ok: false; error: string };

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

/** What a person says about a new item. The form's `name`s are these. */
export interface NewItem {
  slot: Slot;
  type: ItemType;
  name: string;
  photo: File;
}

/** Where `POST /items/upload-url` says a file goes. */
export interface UploadTarget {
  key: string;
  url: string;
}
