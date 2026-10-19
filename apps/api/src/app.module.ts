import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { AuthModule } from './auth/auth.module.js';
import { envSchema } from './config/env.js';
import { HealthModule } from './health/health.module.js';
import { ItemsModule } from './items/items.module.js';
import { OutfitsModule } from './outfits/outfits.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { validationException } from './validation/validation-exception.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envSchema }),
    PrismaModule,
    AuthModule,
    HealthModule,
    ItemsModule,
    OutfitsModule,
  ],
  providers: [
    /**
     * Registered as a provider rather than through `app.useGlobalPipes` in `main.ts`:
     * the end-to-end tests build the application from this module and never run `main.ts`,
     * so a pipe installed there would be missing exactly where it needs proving.
     */
    {
      provide: APP_PIPE,
      useValue: new StandardSchemaValidationPipe({ exceptionFactory: validationException }),
    },
  ],
})
export class AppModule {}
