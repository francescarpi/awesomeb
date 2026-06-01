import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const mocksDir = resolve(__dirname, 'src/test/mocks');

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('src/main'),
      '~': resolve('src/shared'),
      electron: resolve(mocksDir, 'electron.ts'),
      'electron-log': resolve(mocksDir, 'electron-log.ts'),
      'electron-context-menu': resolve(mocksDir, 'electron-context-menu.ts'),
    },
  },
  test: {
    setupFiles: ['vitest.setup.ts'],
    exclude: ['node_modules/**', 'dist/**'],
  },
});
