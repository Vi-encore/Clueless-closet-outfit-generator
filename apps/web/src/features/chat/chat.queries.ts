import { queryOptions } from '@tanstack/react-query';
import { listConversations } from './chat.api';
import { conversationKeys } from './chat.constants';

/** Every conversation, with what is unread in each: the chat screen and the desktop's count. */
export function conversationsQuery() {
  return queryOptions({
    queryKey: conversationKeys.all,
    queryFn: listConversations,
  });
}
