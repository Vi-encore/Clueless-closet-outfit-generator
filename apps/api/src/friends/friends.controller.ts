import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { AccountView } from '../auth/auth.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { usernameSchema } from '../users/username.js';
import { FriendsService, type FriendshipView } from './friends.service.js';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friends: FriendsService) {}

  /** The requests waiting for an answer. Declared before `:username` would matter if
   * this route took one - it does not, but keeping the fixed path first is the habit
   * that stops `requests` from ever being read as somebody's name. */
  @Get('requests')
  listRequests(@CurrentUser() user: AccountView): Promise<FriendshipView[]> {
    return this.friends.listRequests(user.id);
  }

  @Get()
  list(@CurrentUser() user: AccountView): Promise<FriendshipView[]> {
    return this.friends.list(user.id);
  }

  @Get('requests/sent')
  listSent(@CurrentUser() user: AccountView): Promise<FriendshipView[]> {
    return this.friends.listSent(user.id);
  }

  @Get('blocked')
  listBlocked(@CurrentUser() user: AccountView): Promise<FriendshipView[]> {
    return this.friends.listBlocked(user.id);
  }

  /** Works from any prior state: friends, a request either way, or nothing. */
  @Post(':username/block')
  @HttpCode(HttpStatus.OK)
  block(
    @CurrentUser() user: AccountView,
    @Param('username', { schema: usernameSchema }) username: string,
  ): Promise<FriendshipView> {
    return this.friends.block(user.id, username);
  }

  /** Declining, cancelling, unfriending and unblocking all mean "not connected". */
  @Delete(':username')
  remove(
    @CurrentUser() user: AccountView,
    @Param('username', { schema: usernameSchema }) username: string,
  ): Promise<void> {
    return this.friends.remove(user.id, username);
  }

  /**
   * 201 only when something was recorded. Asking somebody who already asked you, or
   * asking twice, changes nothing or changes a status - neither is a creation, and
   * `POST` would otherwise answer 201 to all three.
   */
  @Post(':username')
  async request(
    @CurrentUser() user: AccountView,
    @Param('username', { schema: usernameSchema }) username: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<FriendshipView> {
    const { created, relation } = await this.friends.request(user.id, username);

    response.status(created ? HttpStatus.CREATED : HttpStatus.OK);

    return relation;
  }

  @Post(':username/accept')
  @HttpCode(HttpStatus.OK)
  accept(
    @CurrentUser() user: AccountView,
    @Param('username', { schema: usernameSchema }) username: string,
  ): Promise<FriendshipView> {
    return this.friends.accept(user.id, username);
  }
}
