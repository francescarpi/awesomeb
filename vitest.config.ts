import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    setupFiles: ['vitest.setup.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    alias: {
      '@main': resolve('src/main'),
      '@shared': resolve('src/shared'),
    },
  },
});
