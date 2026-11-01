import { Controller, Get, Param, Query } from '@nestjs/common';
import type { AccountView } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { Page } from '../pagination.js';
import { usernameSchema } from '../users/username.js';
import { ChatService, type ConversationView, type MessageView } from './chat.service.js';
import { listMessagesQuerySchema, type ListMessagesQuery } from './requests/list-messages.query.js';

/**
 * Everything a chat needs that is not live.
 *
 * Over HTTP rather than the socket because a reconnection has to catch up before
 * it can trust anything it is sent, and because a client that has not opened a
 * socket yet should still be able to show a conversation.
 */
@Controller('conversations')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  list(@CurrentUser() user: AccountView): Promise<ConversationView[]> {
    return this.chat.conversationsOf(user.id);
  }

  /** Addressed by person, like `message:send`: a direct conversation's id is
   * bookkeeping, and the client already knows who it is talking to. */
  @Get('with/:username/messages')
  history(
    @CurrentUser() user: AccountView,
    @Param('username', { schema: usernameSchema }) username: string,
    @Query({ schema: listMessagesQuerySchema }) query: ListMessagesQuery,
  ): Promise<Page<MessageView>> {
    return this.chat.historyWith(user.id, username, query);
  }
}
