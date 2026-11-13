import type { ProxyOptions } from 'vite';
import { describe, expect, it } from 'vitest';
import { serverFor } from '../vite.server';

/** One proxy rule of a mode, which has to be there and be an object to be read. */
function rule(mode: string, prefix: string): ProxyOptions {
  const found = serverFor(mode).proxy?.[prefix];

  if (found === undefined || typeof found === 'string') {
    throw new Error(`no proxy rule for ${prefix} in ${mode}`);
  }

  return found;
}

describe('Requirement: One address serves the client, the API and the photos', () => {
  it('Scenario: The phone mode proxies the API and the store', () => {
    const api = rule('phone', '/api');
    const storage = rule('phone', '/storage');

    expect(api.target).toBe('http://localhost:3000');
    expect(api.ws).toBe(true);
    expect(api.changeOrigin).toBe(true);
    expect(api.rewrite?.('/api/auth/me')).toBe('/auth/me');
    expect(api.rewrite?.('/api/socket.io/?EIO=4')).toBe('/socket.io/?EIO=4');

    expect(storage.target).toBe('http://localhost:9000');
    // The store checks the signed host, so the proxy has to present the store's own.
    expect(storage.changeOrigin).toBe(true);
    expect(storage.rewrite?.('/storage/closet-photos/a.webp?X-Amz-Signature=1')).toBe(
      '/closet-photos/a.webp?X-Amz-Signature=1',
    );

    expect(serverFor('phone').allowedHosts).toContain('.trycloudflare.com');
    // Its client reloads the page whenever its own line through the tunnel drops.
    expect(serverFor('phone').hmr).toBe(false);
  });

  it('Scenario: The refresh cookie keeps working through the proxy', () => {
    expect(rule('phone', '/api').cookiePathRewrite).toEqual({
      '/auth/refresh': '/api/auth/refresh',
    });
  });

  it('Scenario: Ordinary development is unchanged', () => {
    const server = serverFor('development');

    expect(server.proxy).toBeUndefined();
    expect(server.port).toBe(5173);
    expect(server.strictPort).toBe(true);
  });
});
