import { http, HttpResponse } from 'msw';
import type { Conversation } from '../src/features/chat/chat.interfaces';
import type { Item } from '../src/features/wardrobe/wardrobe.interfaces';
import type { Relation } from '../src/features/friends/friends.interfaces';
import type { Outfit } from '../src/features/outfits/outfits.interfaces';
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

/** Somebody and how they stand to the person asking, a friend unless a test says not. */
export function aRelation(
  username: string,
  displayName: string | null = null,
  relation: Partial<Omit<Relation, 'user'>> = {},
): Relation {
  return {
    user: { id: `id-of-${username}`, username, displayName },
    status: 'accepted',
    requestedByMe: false,
    ...relation,
  };
}

/** A conversation with somebody, with nothing unread unless a test says so. */
export function aConversation(username: string, unread = 0): Conversation {
  return {
    id: `conversation-with-${username}`,
    user: { id: `id-of-${username}`, username, displayName: null },
    lastMessageAt: '2026-11-01T12:00:00.000Z',
    unread,
  };
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
    archivedAt: null,
    archivedReason: null,
    photoUrl: null,
    cutoutUrl: null,
    colors: null,
    pattern: null,
    fabricType: null,
    materials: null,
    fit: null,
    length: null,
    rise: null,
    seasons: [],
    warmth: null,
    formality: null,
    styles: [],
    occasions: [],
    avoidOccasions: [],
    brand: null,
    size: null,
    price: null,
    currency: 'UAH',
    notes: null,
    ...overrides,
  };
}

/** A generated outfit of a top and a bottom, with only what a test cares about stated. */
export function anOutfit(overrides: Partial<Outfit> = {}): Outfit {
  return {
    id: '00000000-0000-4000-8000-0000000000f1',
    occasion: 'casual',
    score: { total: 1.5, breakdown: { color: 0.5, formality: 1 } },
    reaction: null,
    savedAt: null,
    createdAt: '2026-11-08T10:00:00.000Z',
    items: [
      anItem({
        id: 'top',
        name: 'White blouse',
        slot: 'top',
        type: 'blouse',
        cutoutUrl: 'https://s.test/top.webp',
      }),
      anItem({
        id: 'bottom',
        name: 'Plaid skirt',
        slot: 'bottom',
        type: 'skirt',
        cutoutUrl: 'https://s.test/bottom.webp',
      }),
    ],
    ...overrides,
  };
}
