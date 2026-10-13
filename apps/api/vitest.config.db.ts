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
  },
});
