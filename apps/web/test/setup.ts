import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setAccessToken } from '../src/platform/token-store';
import { server } from './server';

// `error`, not the default warning: a request nothing answers means a test is
// exercising something it never described, and a warning scrolls past. Note the name:
// MSW 2 called this `onUnhandledRequest`, and MSW 3 ignores that spelling at runtime.
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  // It lives in a module, which outlasts a test the way it outlasts a render.
  setAccessToken(null);
});

afterAll(() => {
  server.close();
});
