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

export function acceptRequest(username: string): Promise<Relation> {
  return request<Relation>(`/friends/${encodeURIComponent(username)}/accept`, { method: 'POST' });
}

/** Declining, withdrawing, unfriending and unblocking are all this one route. */
export function endRelation(username: string): Promise<void> {
  return request<void>(`/friends/${encodeURIComponent(username)}`, { method: 'DELETE' });
}
