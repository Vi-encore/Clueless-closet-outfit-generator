import { describe, expect, it } from 'vitest';
import { readSuggestion } from './tag-suggestion.js';

describe('Requirement: A tag suggestion has the shape of the tags', () => {
  it('Scenario: A valid suggestion is read as it is', () => {
    const suggestion = readSuggestion({
      slot: 'top',
      type: 'blouse',
      seasons: ['spring', 'summer'],
    });

    expect(suggestion.slot).toBe('top');
    expect(suggestion.type).toBe('blouse');
    expect(suggestion.seasons).toEqual(['spring', 'summer']);
  });

  it('Scenario: An invalid field becomes null', () => {
    const suggestion = readSuggestion({ slot: 'top', pattern: 'tartan-ish' });

    expect(suggestion.pattern).toBeNull();
    expect(suggestion.slot).toBe('top');
  });

  it('Scenario: A type from another slot becomes null', () => {
    const suggestion = readSuggestion({ slot: 'bottom', type: 'blouse' });

    expect(suggestion.type).toBeNull();
    expect(suggestion.slot).toBe('bottom');
  });

  it('Scenario: A missing field is null', () => {
    const suggestion = readSuggestion({});

    const { uncertain, ...tags } = suggestion;

    expect(Object.values(tags).every((value) => value === null)).toBe(true);
    expect(Object.keys(tags).length).toBeGreaterThan(10);
    expect(uncertain).toEqual([]);
  });

  it('keeps only uncertain fields that name a tag', () => {
    expect(readSuggestion({ uncertain: ['materials', 'nonsense'] }).uncertain).toEqual([
      'materials',
    ]);
  });

  it('reads something that is not an object as an empty suggestion', () => {
    expect(readSuggestion('a blouse').slot).toBeNull();
  });
});
