import { request } from './client';
import type { Conversation } from './api.interfaces';

export function listConversations(): Promise<Conversation[]> {
  return request<Conversation[]>('/conversations');
}
