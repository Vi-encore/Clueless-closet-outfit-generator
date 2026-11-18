/**
 * Where people live in the cache. A friend's wardrobe sits under `all` on purpose: a
 * relation that ends changes what their wardrobe answers, and refreshing `all` after any
 * change to a relation reaches it too.
 */
export const friendKeys = {
  all: ['friends'] as const,
  wardrobe: (username: string) => [...friendKeys.all, username, 'items'] as const,
  waiting: () => [...friendKeys.all, 'requests', 'waiting'] as const,
};
