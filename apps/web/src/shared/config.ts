const url = import.meta.env.VITE_API_URL;

// Here rather than defaulted to localhost, for the reason `DATABASE_URL` has no default
// on the API: a build that quietly called the wrong place would look like a broken API.
if (!url) {
  throw new Error('VITE_API_URL is not set: this build does not know where the API is');
}

/** Where the API is. A native shell has no proxy, so it is always an absolute address. */
export const API_URL: string = url;
