import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    setupFiles: ['config-test.ts'],
    alias: {
      '@': resolve('src/main'),
      '~': resolve('src/shared'),
    },
  },
});
