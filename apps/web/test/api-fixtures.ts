import { http, HttpResponse } from 'msw';
import type { Item } from '../src/api/api.interfaces';
import { API, server } from './server';

const account = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'cher@example.com',
  username: 'cher',
  displayName: 'Cher Horowitz',
};

/** Somebody with a live refresh cookie, so the application starts signed in. */
export function signedIn(): void {
  server.use(
    http.post(`${API}/auth/refresh`, () => HttpResponse.json({ accessToken: 'a-token' })),
    http.get(`${API}/auth/me`, () => HttpResponse.json(account)),
  );
}

/** An item as the API answers with one, with only what a test cares about stated. */
export function anItem(overrides: Partial<Item> = {}): Item {
  return {
    id: '00000000-0000-4000-8000-0000000000aa',
    name: 'Yellow blazer',
    slot: 'outerwear',
    type: 'blazer',
    visibility: 'private',
    status: 'available',
    photoUrl: null,
    ...overrides,
  };
}
