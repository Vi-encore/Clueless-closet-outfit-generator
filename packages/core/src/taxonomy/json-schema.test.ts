import { describe, expect, it } from 'vitest';
import { getItemTagsJsonSchema } from './json-schema.js';
import { SLOTS, STYLES } from './vocabularies.js';
import type { SchemaWithProperties } from '../test.interfaces.js';

describe('Requirement: Tag schema export', () => {
  it('Scenario: Vocabulary reflected in the schema', () => {
    const schema = getItemTagsJsonSchema() as SchemaWithProperties;

    expect(schema.properties.styles?.items?.enum).toEqual([...STYLES]);
    expect(schema.properties.slot?.enum).toEqual([...SLOTS]);
  });
});
