import { ApiError } from '../../shared/api/api-error';
import { request } from '../../shared/api/client';
import type {
  DiaryEntry,
  EntryChanges,
  EntryPatch,
  Memory,
  UploadTarget,
} from './diary.interfaces';

/** The person's records in one month, `YYYY-MM`, in date order. */
export function listMonth(month: string): Promise<DiaryEntry[]> {
  return request<DiaryEntry[]>(`/diary?${new URLSearchParams({ month }).toString()}`);
}

/** The days exactly a year and a month before today, each marked which it is. */
export function listMemories(): Promise<Memory[]> {
  return request<Memory[]>('/diary/memories');
}

/**
 * Sends a photo of the day to storage and answers its key, as an item's photo is sent.
 * Plain `fetch` for the upload: storage is not our API, and no credentials go to it.
 */
async function uploadDiaryPhoto(photo: Blob): Promise<string> {
  const { key, url } = await request<UploadTarget>('/diary/upload-url', {
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
 * Saves a day's note and photo, the photo first: a record never points at a file that
 * did not arrive, and the worst a failure leaves is a file nothing points at.
 */
export async function saveEntry(id: string, { note, photo }: EntryChanges): Promise<DiaryEntry> {
  const trimmed = note.trim();
  const body: EntryPatch = { note: trimmed === '' ? null : trimmed };

  if (photo === null) {
    body.photoKey = null;
  } else if (photo !== undefined) {
    body.photoKey = await uploadDiaryPhoto(photo);
  }

  return request<DiaryEntry>(`/diary/${id}`, { method: 'PATCH', body });
}
