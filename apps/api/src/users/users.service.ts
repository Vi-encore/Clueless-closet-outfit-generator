import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { PublicUser } from './users.interfaces.js';

const publicFields = {
  id: true,
  username: true,
  displayName: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds one person by their exact username.
   *
   * There is no search and no listing anywhere in the project: you reach somebody by
   * knowing what they are called, which is what keeps a wardrobe app from having a
   * directory of people to browse.
   */
  async findByUsername(username: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: publicFields,
    });

    if (!user) {
      throw new NotFoundException('No such person');
    }

    return user;
  }
}
