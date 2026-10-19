import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  // The friends module resolves a username into a person before it can record
  // anything about the two of them.
  exports: [UsersService],
})
export class UsersModule {}
