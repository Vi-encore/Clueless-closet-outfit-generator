import { request } from './client';
import type { Relation } from './api.interfaces';

export function listFriends(): Promise<Relation[]> {
  return request<Relation[]>('/friends');
}

export function listWaitingRequests(): Promise<Relation[]> {
  return request<Relation[]>('/friends/requests');
}

export function listSentRequests(): Promise<Relation[]> {
  return request<Relation[]>('/friends/requests/sent');
}

export function listBlocked(): Promise<Relation[]> {
  return request<Relation[]>('/friends/blocked');
}

export function askToBeFriends(username: string): Promise<Relation> {
  return request<Relation>(`/friends/${encodeURIComponent(username)}`, { method: 'POST' });
}
