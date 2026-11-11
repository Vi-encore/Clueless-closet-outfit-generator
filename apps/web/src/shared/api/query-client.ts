import { QueryClient } from '@tanstack/react-query';

/**
 * The cache of what the API answered, with the rules it keeps.
 *
 * No retries, for queries or for changes. A 404 here is an answer rather than a hiccup,
 * and three attempts with backoff would hold "not found" and "cannot be loaded" back by
 * seconds. A person who wants to try again opens the screen again, and it asks.
 *
 * Everything else is TanStack's default on purpose: what is cached is stale at once, so
 * a screen opened again shows it and asks behind it; it is dropped five minutes after the
 * last screen using it closes; and coming back to the tab asks again.
 *
 * A factory rather than one client, so that each mounted application, and so each test,
 * starts with nothing in it.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}
