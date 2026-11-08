import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['tests/support/setup.ts'],
    // All test files share one Mongo test database.
    fileParallelism: false,
  },
});
