import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  integrations: [icon({ iconDir: 'src/renderer/icons' })],

  output: 'static',
  srcDir: 'src/renderer',
  outDir: 'dist-electron/renderer',

  build: {
    assetsPrefix: '../',
  },

  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('src/main'),
        '~': path.resolve('src/shared'),
        '#': path.resolve('src/renderer'),
        '@preload': './src/preload',
        '@renderer': './src/renderer',
      },
    },
  },

  devToolbar: {
    enabled: false,
  },
});
