import { http, HttpResponse } from 'msw';
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
 * The one standing answer is that nobody is signed in, because the application asks
 * that of the API every time it starts.
 */
export const server = setupServer(
  http.post(`${API}/auth/refresh`, () => new HttpResponse(null, { status: 401 })),
);
