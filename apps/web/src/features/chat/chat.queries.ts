import { queryOptions } from '@tanstack/react-query';
import { listConversations } from './chat.api';

export const conversationKeys = {
  all: ['conversations'] as const,
};

/** Every conversation, with what is unread in each: the chat screen and the desktop's count. */
export const conversationsQuery = queryOptions({
  queryKey: conversationKeys.all,
  queryFn: listConversations,
});
