import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { usernameSchema } from './username.js';
import type { PublicUser } from './users.interfaces.js';

/**
 * Signed in like everything else: who exists is not public information, and a
 * stranger with no account should not be able to check whether a name is taken.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(':username')
  findOne(@Param('username', { schema: usernameSchema }) username: string): Promise<PublicUser> {
    return this.users.findByUsername(username);
  }
}
