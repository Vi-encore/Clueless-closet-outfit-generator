import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';
import type { HealthStatus } from './health.interfaces.js';

// A health check nobody can read is not a health check.
@Public()
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthStatus {
    return { status: 'ok' };
  }
}
