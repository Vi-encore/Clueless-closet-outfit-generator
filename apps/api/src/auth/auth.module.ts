import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { Env } from '../config/env.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { JwtStrategy } from './jwt.strategy.js';
import { RefreshTokenService } from './refresh-token.service.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        // A number is seconds, which is what the setting already holds.
        signOptions: { expiresIn: config.get('ACCESS_TOKEN_TTL', { infer: true }) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenService,
    JwtStrategy,
    {
      /**
       * Global on purpose: a route is protected unless it is marked `@Public()`.
       * The other way round, forgetting a decorator would quietly publish someone's
       * wardrobe, and nothing would fail to tell us.
       */
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
