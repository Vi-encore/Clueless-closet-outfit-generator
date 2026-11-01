import { setupServer } from 'msw/node';

/**
 * The API, as far as a test can tell.
 *
 * Answers at the `fetch` boundary rather than by mocking our own client, so a test
 * runs the client too. Nothing is answered by default: a test states what the API
 * says with `server.use(...)`, which keeps the answer beside the behaviour it causes.
 */
export const server = setupServer();
