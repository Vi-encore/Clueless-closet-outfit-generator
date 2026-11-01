import { request } from './client';
import type { Conversation, Message, Page } from './api.interfaces';

export function listConversations(): Promise<Conversation[]> {
  return request<Conversation[]>('/conversations');
}

/** A page of a conversation, newest first, or the page before a cursor. */
export function listMessages(username: string, cursor?: string): Promise<Page<Message>> {
  const query = cursor === undefined ? '' : `?cursor=${cursor}`;

  return request<Page<Message>>(
    `/conversations/with/${encodeURIComponent(username)}/messages${query}`,
  );
}

export function markRead(username: string): Promise<void> {
  return request<void>(`/conversations/with/${encodeURIComponent(username)}/read`, {
    method: 'POST',
  });
}
