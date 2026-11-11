import { describe, expect, it } from 'vitest';
import { OCCASIONS } from '../taxonomy/vocabularies.js';
import { SYSTEM_OCCASIONS } from './occasions.js';
import { occasionSchema } from './schemas.js';

describe('Requirement: Every occasion has a target and weights', () => {
  it('Scenario: Every code is an occasion', () => {
    expect(Object.keys(SYSTEM_OCCASIONS).sort()).toEqual([...OCCASIONS].sort());
    for (const code of OCCASIONS) {
      const occasion = SYSTEM_OCCASIONS[code];
      expect(occasion.code).toBe(code);
      expect(occasionSchema.safeParse(occasion).success).toBe(true);
    }
  });

  it('Scenario: Work is more formal than home', () => {
    expect(SYSTEM_OCCASIONS.work.targetFormality).toBeGreaterThan(
      SYSTEM_OCCASIONS.home.targetFormality,
    );
  });
});
