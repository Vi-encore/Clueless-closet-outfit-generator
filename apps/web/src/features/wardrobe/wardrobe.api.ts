import type { ArchiveReason, Visibility } from '@closet/core';
import { ApiError } from '../../shared/api/api-error';
import { request } from '../../shared/api/client';
import type { Page } from '../../shared/api/api.interfaces';
import type { Item, NewItem, UploadTarget } from './wardrobe.interfaces';
import type { ItemQuery, FriendItemQuery } from './wardrobe.interfaces';

/** Fewer than the API's default: every one of these is a whole photograph on a phone. */
const PAGE_SIZE = 24;

export function listItems({ slot, status, cursor }: ItemQuery): Promise<Page<Item>> {
  const query = new URLSearchParams({ limit: String(PAGE_SIZE) });

  if (slot !== undefined) {
    query.set('slot', slot);
  }

  if (status !== undefined) {
    query.set('status', status);
  }

  if (cursor !== undefined) {
    query.set('cursor', cursor);
  }

  return request<Page<Item>>(`/items?${query.toString()}`);
}

/** Only what they marked for friends: the API has no way to ask for the rest. */
export function listFriendItems({ username, cursor }: FriendItemQuery): Promise<Page<Item>> {
  const query = new URLSearchParams({ limit: String(PAGE_SIZE) });

  if (cursor !== undefined) {
    query.set('cursor', cursor);
  }

  return request<Page<Item>>(`/users/${encodeURIComponent(username)}/items?${query.toString()}`);
}

export function findItem(id: string): Promise<Item> {
  return request<Item>(`/items/${id}`);
}

export function setVisibility(id: string, visibility: Visibility): Promise<Item> {
  return request<Item>(`/items/${id}`, { method: 'PATCH', body: { visibility } });
}

/** `DELETE` is what a client means and archiving is what happens: nothing is destroyed. */
export function archiveItem(id: string, reason: ArchiveReason): Promise<Item> {
  return request<Item>(`/items/${id}?reason=${reason}`, { method: 'DELETE' });
}

/** Back from the archive, forgetting when and why it left. */
export function restoreItem(id: string): Promise<Item> {
  return request<Item>(`/items/${id}/restore`, { method: 'POST' });
}

/**
 * Puts a file where the API said, and returns the key that names it.
 *
 * Plain `fetch` rather than `request`: this is not our API, a 401 from it is not an
 * expired token, and the access token must never reach storage. No credentials of any
 * kind go with it, since the URL carries its own authorisation.
 */
async function uploadPhoto(photo: File): Promise<string> {
  const { key, url } = await request<UploadTarget>('/items/upload-url', {
    method: 'POST',
    body: { contentType: photo.type },
  });

  const answer = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': photo.type },
    credentials: 'omit',
    body: photo,
  });

  if (!answer.ok) {
    throw new ApiError(answer.status);
  }

  return key;
}

/**
 * Adds an item, its photograph first.
 *
 * In that order on purpose. The other way round leaves an item pointing at something
 * that may never arrive, while this way round the worst case is a file nothing points
 * at: storage wasted, rather than data wrong.
 */
export async function createItem({ slot, type, name, photo }: NewItem): Promise<Item> {
  const photoOriginalKey = await uploadPhoto(photo);
  const trimmed = name.trim();

  return request<Item>('/items', {
    method: 'POST',
    body: { slot, type, photoOriginalKey, ...(trimmed === '' ? {} : { name: trimmed }) },
  });
}
