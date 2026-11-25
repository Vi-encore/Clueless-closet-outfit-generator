import { describe, expect, it } from 'vitest';
import { keyFor, ownerOf } from './keys.js';

const OWNER = '5ec22a94-2e82-4241-a4b3-0f08b405064d';

describe('keys know their folder', () => {
  it('files a diary photo under diary/', () => {
    const key = keyFor('diary', OWNER, 'image/webp');

    expect(key.startsWith(`diary/${OWNER}/`)).toBe(true);
    expect(key.endsWith('.webp')).toBe(true);
  });

  it('reads the owner only from the folder asked about', () => {
    const diary = keyFor('diary', OWNER, 'image/jpeg');
    const item = keyFor('items', OWNER, 'image/png');

    expect(ownerOf('diary', diary)).toBe(OWNER);
    expect(ownerOf('items', item)).toBe(OWNER);
    expect(ownerOf('items', diary)).toBeNull();
    expect(ownerOf('diary', item)).toBeNull();
  });
});
