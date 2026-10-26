import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /** The conversations a person is in, which is what their socket joins on connect. */
  async conversationIdsOf(userId: string): Promise<string[]> {
    const rows = await this.prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    return rows.map((row) => row.conversationId);
  }
}
