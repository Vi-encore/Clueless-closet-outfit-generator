import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.js';
import { setupOpenApi } from './docs/openapi.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  setupOpenApi(app);
  // Without this, a termination signal kills the process before onModuleDestroy
  // runs and the database connection is never closed politely.
  app.enableShutdownHooks();

  const config: ConfigService<Env, true> = app.get(ConfigService);
  await app.listen(config.get('PORT', { infer: true }));
}

await bootstrap();
