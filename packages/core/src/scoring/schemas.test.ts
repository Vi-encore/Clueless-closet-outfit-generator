import { describe, expect, it } from 'vitest';
import type { ZodType } from 'zod';
import { occasionSchema, outfitItemSchema } from './schemas.js';

/** Top-level fields that failed validation; empty when the input is valid. */
function failedFields(schema: ZodType, input: unknown): string[] {
  const result = schema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => String(issue.path[0]));
}

describe('Requirement: Occasion validation', () => {
  it('Scenario: Valid occasion', () => {
    const occasion = { code: 'party', targetFormality: 4, weights: { color: 2 } };
    expect(failedFields(occasionSchema, occasion)).toEqual([]);
  });

  it('Scenario: Target formality out of range', () => {
    expect(failedFields(occasionSchema, { code: 'work', targetFormality: 6 })).toEqual([
      'targetFormality',
    ]);
  });

  it('Scenario: Negative weight', () => {
    const occasion = { code: 'work', targetFormality: 3, weights: { color: -1 } };
    expect(failedFields(occasionSchema, occasion)).toEqual(['weights']);
  });
});

describe('Requirement: Outfit items carry an id', () => {
  it('Scenario: Missing id', () => {
    expect(failedFields(outfitItemSchema, { slot: 'top', type: 'blouse' })).toEqual(['id']);
  });

  it('Scenario: Tags still checked', () => {
    expect(failedFields(outfitItemSchema, { id: 'b1', slot: 'bottom', type: 'blouse' })).toEqual([
      'type',
    ]);
  });
});
