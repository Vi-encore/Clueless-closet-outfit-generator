import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { setupBrowserAccess } from './browser/browser-access.js';
import type { Env } from './config/env.js';
import { setupOpenApi } from './docs/openapi.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // The refresh token arrives in a cookie, and nothing reads cookies without this.
  app.use(cookieParser());
  setupBrowserAccess(app);
  setupOpenApi(app);
  // Without this, a termination signal kills the process before onModuleDestroy
  // runs and the database connection is never closed politely.
  app.enableShutdownHooks();

  const config: ConfigService<Env, true> = app.get(ConfigService);
  // Who the rate limiter counts. With no proxy in front this stays 0, and the
  // socket's own address is used; `X-Forwarded-For` is believed for exactly as many
  // hops as the deployment says are really there.
  app.set('trust proxy', config.get('TRUST_PROXY', { infer: true }));
  await app.listen(config.get('PORT', { infer: true }));
}

await bootstrap();
