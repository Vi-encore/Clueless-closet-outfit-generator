import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Global, because nearly every feature module will need the database and importing
 * it into each one would be noise. The exception is deliberate: there is one
 * connection pool, and it belongs to the application.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
