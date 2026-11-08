import type { ArchiveReason, ItemStatus, ItemType, Slot, Visibility } from '@closet/core';
import type { InfiniteData } from '@tanstack/react-query';
import type { Page } from '../../shared/api/api.interfaces';

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

export interface ItemQuery {
  slot?: Slot | undefined;
  cursor?: string | undefined;
}

export interface FriendItemQuery {
  username: string;
  cursor?: string | undefined;
}

/** As the form holds it: a file input can be empty, and `createItem` wants a photograph. */
export type NewItemForm = Omit<NewItem, 'photo'> & { photo: File | null };

export interface ItemTileProps {
  item: Item;
}

/** A wardrobe list as the cache holds it: the pages so far, and the cursor behind each. */
export type ItemPages = InfiniteData<Page<Item>, string | undefined>;

export interface ItemSheetProps {
  item: Item;
}

export interface SharingSwitchProps {
  item: Item;
}

export interface ArchiveFormProps {
  id: string;
}

/** Empty until a reason is chosen, which is what the form refuses. */
export interface ArchiveFields {
  reason: ArchiveReason | '';
}
