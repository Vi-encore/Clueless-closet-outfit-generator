import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';

// A health check nobody can read is not a health check.
@Public()
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
