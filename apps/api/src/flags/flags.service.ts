import type { FlagName, Flags } from '@closet/core';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { flagsFrom } from './flags.utils.js';

/**
 * The deployment's feature flags, worked out once from its settings.
 *
 * Settings do not change while the API runs, so neither do these: a flag is switched by
 * changing the setting and restarting, which is all a single deployment needs.
 */
@Injectable()
export class FlagsService {
  private readonly flags: Flags;

  constructor(config: ConfigService<Env, true>) {
    this.flags = flagsFrom(
      config.get('FEATURES_ON', { infer: true }),
      config.get('FEATURES_OFF', { infer: true }),
    );
  }

  /** Every flag and its value, as the client is told. */
  all(): Flags {
    return { ...this.flags };
  }

  /** For code inside the API that follows a flag. */
  isOn(name: FlagName): boolean {
    return this.flags[name];
  }
}
