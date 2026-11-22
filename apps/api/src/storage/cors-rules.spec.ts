import { describe, expect, it } from 'vitest';
import { corsRulesFor } from './cors-rules.js';

const CLIENT = 'http://localhost:5173';
const DEPLOYED = 'https://closet.pages.dev';

describe('Requirement: A browser may upload to the bucket', () => {
  it('Scenario: The rules name the configured origins', () => {
    const origins = corsRulesFor([CLIENT, DEPLOYED]).flatMap((rule) => rule.AllowedOrigins);

    expect(origins).toEqual([CLIENT, DEPLOYED]);
  });

  it('Scenario: Only an upload is allowed', () => {
    const rules = corsRulesFor([CLIENT]);

    // The name is the requirement's from before reading was allowed: an upload, and reading
    // a photograph back so a card can cut its background out again, and nothing else.
    expect(rules.flatMap((rule) => rule.AllowedMethods)).toEqual(['PUT', 'GET']);
    expect(rules.flatMap((rule) => rule.AllowedHeaders)).toEqual(['content-type']);
  });

  it('Scenario: No origins is refused', () => {
    expect(() => corsRulesFor([])).toThrow(/WEB_ORIGINS/);
  });
});
