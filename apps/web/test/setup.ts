import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { setAccessToken } from '../src/platform/token-store';
import { server } from './server';
import { socketServer } from './socket-server';

// Every connection goes to the real server these tests run, wherever the client meant
// it for: `API_URL` is an address nothing listens on, and is meant to be.
vi.mock('socket.io-client', async (original) => {
  const real = await original<typeof import('socket.io-client')>();

  return {
    ...real,
    io: (_url: string, options: Parameters<typeof real.io>[1]) =>
      real.io(socketServer.url, options),
  };
});

// `error`, not the default warning: a request nothing answers means a test is
// exercising something it never described, and a warning scrolls past. Note the name:
// MSW 2 called this `onUnhandledRequest`, and MSW 3 ignores that spelling at runtime.
beforeAll(async () => {
  await socketServer.start();
  server.listen({
    // The socket server is the one thing that is meant to be really reached. The message
    // is the only place MSW names the address for an HTTP frame and a WebSocket alike.
    onUnhandledFrame: async ({ frame, defaults }) => {
      if (!(await frame.getUnhandledMessage()).includes(socketServer.host)) {
        defaults.error();
      }
    },
  });
});

afterEach(() => {
  server.resetHandlers();
  // It lives in a module, which outlasts a test the way it outlasts a render.
  setAccessToken(null);
  socketServer.reset();
});

afterAll(async () => {
  server.close();
  await socketServer.stop();
});
