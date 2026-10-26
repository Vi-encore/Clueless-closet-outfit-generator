import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service.js';

/**
 * Global, like Prisma: a photograph can belong to anything, and the alternative
 * is importing this module into every feature that ever grows one.
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
