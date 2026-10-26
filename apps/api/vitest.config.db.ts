import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    setupFiles: ['./test/setup-db.ts'],
    include: ['**/*.db-spec.ts'],
    // One database, shared by every file in the run: parallel suites would
    // delete each other's rows between a write and the read that checks it.
    fileParallelism: false,
    // A hook here builds an entire Nest application and connects it to Postgres,
    // which Vitest's generic ten seconds is not sized for: one was seen to time
    // out under load while the same suite passed on its own, and a suite that
    // fails only sometimes teaches nobody anything.
    hookTimeout: 30_000,
  },
});
