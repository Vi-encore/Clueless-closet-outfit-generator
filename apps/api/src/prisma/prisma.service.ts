import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Env } from '../config/env.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * The database client, owned by Nest so that its connection follows the application's
 * life rather than the process's.
 *
 * Prisma 7 has no built-in database driver: the adapter is what actually talks to
 * PostgreSQL, and the client is the typed layer above it.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: new PrismaPg({ connectionString: config.get('DATABASE_URL', { infer: true }) }),
    });
  }

  /**
   * Connecting here rather than lazily on the first query means a wrong connection
   * string is a startup failure, not an error for whoever happens to make the first
   * request.
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
