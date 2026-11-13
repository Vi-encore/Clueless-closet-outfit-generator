const url = import.meta.env.VITE_API_URL;

// Here rather than defaulted to localhost, for the reason `DATABASE_URL` has no default
// on the API: a build that quietly called the wrong place would look like a broken API.
if (!url) {
  throw new Error('VITE_API_URL is not set: this build does not know where the API is');
}

// A path on this page's own origin, which is how the phone mode reaches the API through
// its proxy, or a whole address. Anything else, `api` without a slash say, would be read
// relative to whatever page happened to be open.
if (!url.startsWith('/') && URL.parse(url) === null) {
  throw new Error(`VITE_API_URL is neither a path nor an address: ${url}`);
}

/**
 * Where the API is: an address in development and in a native shell, which has no proxy,
 * or a path such as `/api` behind the phone mode's.
 */
export const API_URL: string = url;
