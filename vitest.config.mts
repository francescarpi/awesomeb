import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('src/main'),
      '~': resolve('src/shared'),
      '#': resolve('src/renderer'),
      '@renderer': resolve('src/renderer'),
    },
  },
  test: {
    setupFiles: ['vitest.setup.ts'],
    exclude: ['node_modules/**', '.opencode/**', 'dist/**', 'docs/**'],
  },
});
