import type { Flags } from '@closet/core';
import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator.js';
import { FlagsService } from './flags.service.js';

// Public: a screen before sign-in may follow a flag, and a flag says only what the
// client may show, which is no secret.
@Public()
@Controller('flags')
export class FlagsController {
  constructor(private readonly flags: FlagsService) {}

  @Get()
  list(): Flags {
    return this.flags.all();
  }
}
