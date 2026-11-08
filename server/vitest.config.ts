import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['src/test/setup.ts'],
    // All test files share one Mongo test database.
    fileParallelism: false,
  },
});
