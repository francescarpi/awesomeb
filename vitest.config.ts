import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('src/main'),
      '~': resolve('src/shared'),
    },
  },
  test: {
    setupFiles: ['vitest.setup.ts'],
    exclude: ['node_modules/**', 'dist/**'],
  },
});
