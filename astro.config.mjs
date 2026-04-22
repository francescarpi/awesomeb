import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';
import electron from 'astro-electron';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

const isBuild = process.env.NODE_ENV === 'production';
const MINIFY = isBuild;

// Shared aliases between main process and preload
const electronAliases = {
  '@': path.resolve('src/main'),
  '~': path.resolve('src/shared'),
  '#': path.resolve('src/renderer'),
};

// Aliases for the renderer (Astro)
const rendererAliases = {
  ...electronAliases,
  '@preload': './src/preload',
  '@renderer': './src/renderer',
};

// Configuration for the main process of Electron
const electronMainConfig = {
  entry: 'src/main/index.ts',
  vite: {
    build: {
      minify: MINIFY ? 'esbuild' : false,
      outDir: 'dist-electron/main',
    },
    plugins: [
      // Copy icons for the main process
      viteStaticCopy({
        targets: [
          {
            src: './src/main/assets/icons',
            dest: './assets/icons',
            rename: { stripBase: true }
          },
        ],
      }),
    ],
    resolve: {
      alias: electronAliases,
    },
  },
};

// Configuration for the Electron preload
const electronPreloadConfig = {
  vite: {
    build: {
      minify: MINIFY ? 'esbuild' : false,
      rolldownOptions: {
        input: {
          'preload/browser.preload': 'src/preload/browser.preload.ts',
          'preload/tab.preload': 'src/preload/tab.preload.ts',
          'preload/extension.preload': 'src/preload/extension.preload.ts',
        },
        output: {
          inlineDynamicImports: false,
        },
      },
    },
    resolve: {
      alias: electronAliases,
    },
  },
};

// Configuration for the Electron preload
const electronRendererConfig = {}

export default defineConfig({
  // === INTEGRATIONS ===
  integrations: [
    // Icons for the renderer
    icon({
      iconDir: 'src/renderer/icons',
    }),

    // Electron Configuration
    electron({
      main: electronMainConfig,
      preload: electronPreloadConfig,
      renderer: electronRendererConfig,
    }),
  ],

  // === ASTRO CONFIG ===
  output: 'static',
  srcDir: 'src/renderer',
  outDir: 'dist-electron/renderer',

  build: {
    assetsPrefix: '../',
  },

  // === VITE CONFIG ===
  vite: {
    plugins: [
      tailwindcss(),
    ],
    resolve: {
      alias: rendererAliases,
    },
  },

  // === DEV CONFIG ===
  devToolbar: {
    enabled: false,
  },
});
