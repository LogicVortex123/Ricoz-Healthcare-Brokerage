import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    maxWorkers: 1,
    hookTimeout: 120000,
    testTimeout: 30000,
  },
});
