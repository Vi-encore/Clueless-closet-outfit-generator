import { request } from '../../shared/api/client';
import type { Page } from '../../shared/api/api.interfaces';
import type {
  GenerateAnswer,
  GenerateRequest,
  Outfit,
  Reaction,
  WearRecord,
} from './outfits.interfaces';

/** Each one of these is a doll of photographs on a phone. */
const PAGE_SIZE = 12;

/** Makes and stores a new outfit every time: never cached, never retried. */
export function generateOutfit(body: GenerateRequest): Promise<GenerateAnswer> {
  return request<GenerateAnswer>('/outfits/generate', { method: 'POST', body });
}

export function findOutfit(id: string): Promise<Outfit> {
  return request<Outfit>(`/outfits/${id}`);
}

export function listSavedOutfits(cursor: string | undefined): Promise<Page<Outfit>> {
  const query = new URLSearchParams({ limit: String(PAGE_SIZE) });

  if (cursor !== undefined) {
    query.set('cursor', cursor);
  }

  return request<Page<Outfit>>(`/outfits/saved?${query.toString()}`);
}

/** Null takes the reaction back. */
export function setReaction(id: string, reaction: Reaction | null): Promise<Outfit> {
  return request<Outfit>(`/outfits/${id}/reaction`, { method: 'PUT', body: { reaction } });
}

export function saveOutfit(id: string): Promise<Outfit> {
  return request<Outfit>(`/outfits/${id}/save`, { method: 'PUT' });
}

export function unsaveOutfit(id: string): Promise<Outfit> {
  return request<Outfit>(`/outfits/${id}/save`, { method: 'DELETE' });
}

/** Once a day per outfit: asking again answers the same record. */
export function wearOutfit(id: string): Promise<WearRecord> {
  return request<WearRecord>(`/outfits/${id}/wear`, { method: 'POST' });
}
