import { http, HttpResponse } from 'msw';
import { FLAG_DEFAULTS } from '@closet/core';
import { setupServer } from 'msw/node';

/** `VITE_API_URL` as vite.config.ts sets it for the tests. */
export const API = 'http://api.test';

/**
 * The API, as far as a test can tell.
 *
 * Answers at the `fetch` boundary rather than by mocking our own client, so a test
 * runs the client too. A test states what the API says with `server.use(...)`, which
 * keeps the answer beside the behaviour it causes.
 *
 * Three standing answers, for what the application asks by itself: nobody is signed in,
 * whoever is has no conversations, and every feature flag is at its default.
 */
export const server = setupServer(
  http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
  http.get(`${API}/conversations`, () => HttpResponse.json([])),
  http.get(`${API}/flags`, () => HttpResponse.json(FLAG_DEFAULTS)),
);
