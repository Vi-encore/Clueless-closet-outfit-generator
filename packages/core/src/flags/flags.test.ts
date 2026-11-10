import { describe, expect, it } from 'vitest';
import { FLAG_DEFAULTS, FLAG_NAMES } from './flags.constants.js';

describe('Requirement: Flags are one vocabulary with defaults', () => {
  it('Scenario: The cut-out flag exists', () => {
    expect(FLAG_NAMES).toContain('photoCutout');
    expect(FLAG_DEFAULTS.photoCutout).toBe(true);
  });
});
