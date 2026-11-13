/**
 * A presigned link as the client should see it: the store's own origin swapped for a
 * public base when there is one, everything after it, signature included, untouched.
 *
 * The signature covers the host the link was signed for, not the host the browser
 * types, so this holds only behind a proxy that presents the store's own host to it -
 * Vite's `changeOrigin` in the phone mode. A link that does not start with the endpoint
 * is not one of ours to rewrite, and is returned as it came.
 */
export function throughPublicBase(url: string, endpoint: string, base: string | undefined): string {
  const origin = endpoint.replace(/\/+$/, '');

  if (base === undefined || !url.startsWith(`${origin}/`)) {
    return url;
  }

  return `${base}${url.slice(origin.length)}`;
}
