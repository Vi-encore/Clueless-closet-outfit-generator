import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { socketAddress } from '../src/features/chat/chat.utils';
import { server } from './server';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Requirement: The client can reach the API at a relative address', () => {
  it('Scenario: Requests go to the relative address', async () => {
    let asked: string | null = null;
    server.use(
      http.get(`${window.location.origin}/api/auth/me`, ({ request }) => {
        asked = request.url;

        return HttpResponse.json({ id: 'someone' });
      }),
    );
    // The address is read once, when the module loads, so it is loaded again under it.
    vi.stubEnv('VITE_API_URL', '/api');
    vi.resetModules();
    const { request } = await import('../src/shared/api/client');

    await request('/auth/me');

    expect(asked).toBe(`${window.location.origin}/api/auth/me`);
  });

  it('Scenario: The chat connects under the same path', () => {
    expect(socketAddress('/api')).toEqual({ url: undefined, path: '/api/socket.io' });
  });

  it('Scenario: An absolute address is used as it is', () => {
    expect(socketAddress('http://localhost:3000')).toEqual({
      url: 'http://localhost:3000',
      path: '/socket.io',
    });
  });
});
