import { describe, expect, it } from 'vitest';
import { throughPublicBase } from './storage.utils.js';

const ENDPOINT = 'http://localhost:9000';
const SIGNED =
  'http://localhost:9000/closet-photos/items/owner/photo.webp?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc123';

describe('Requirement: Photo links can go through a public base', () => {
  it('Scenario: A view link through the public base', () => {
    expect(throughPublicBase(SIGNED, ENDPOINT, '/storage')).toBe(
      '/storage/closet-photos/items/owner/photo.webp?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=abc123',
    );
  });

  it('Scenario: An upload link through the public base', () => {
    const upload = 'http://localhost:9000/closet-photos/items/owner/new.webp?X-Amz-Signature=def';

    expect(throughPublicBase(upload, ENDPOINT, '/storage')).toMatch(/^\/storage\//);
  });

  it('Scenario: No base, no change', () => {
    expect(throughPublicBase(SIGNED, ENDPOINT, undefined)).toBe(SIGNED);
  });
});
