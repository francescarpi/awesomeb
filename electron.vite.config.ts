import { defineConfig } from 'electron-vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';
import type { Plugin } from 'vite';

const isBuild = process.env.NODE_ENV === 'production';
const MINIFY = isBuild;

const aliases = {
  '@': resolve('src/main'),
  '~': resolve('src/shared'),
  '#': resolve('src/renderer'),
};

function copyIconsPlugin(): Plugin {
  return {
    name: 'awesomeb:copy-icons',
    apply: 'build',
    closeBundle() {
      const srcDir = resolve('src/main/assets/icons');
      const outDir = resolve(__dirname, 'dist-electron/main/assets/icons');
      mkdirSync(outDir, { recursive: true });
      for (const file of readdirSync(srcDir)) {
        copyFileSync(resolve(srcDir, file), resolve(outDir, file));
      }
    },
  };
}

function copyLocalesPlugin(): Plugin {
  return {
    name: 'awesomeb:copy-locales',
    configureServer() {
      copyLocales();
    },
    closeBundle() {
      copyLocales();
    },
  };
}

function copyLocales() {
  const srcDir = resolve('src/shared/i18n/locales');
  const outDir = resolve(__dirname, 'dist-electron/main/locales');
  mkdirSync(outDir, { recursive: true });
  for (const lng of readdirSync(srcDir)) {
    const lngSrc = resolve(srcDir, lng);
    const lngDest = resolve(outDir, lng);
    mkdirSync(lngDest, { recursive: true });
    for (const file of readdirSync(lngSrc)) {
      copyFileSync(resolve(lngSrc, file), resolve(lngDest, file));
    }
  }
}

export default defineConfig({
  main: {
    plugins: [copyIconsPlugin(), copyLocalesPlugin()],
    build: {
      minify: MINIFY ? 'esbuild' : false,
      outDir: 'dist-electron/main',
      externalizeDeps: true,
      rollupOptions: {
        input: { index: resolve('src/main/index.ts') },
        external: ['@electron-webauthn/macos'],
      },
    },
    resolve: { alias: aliases },
  },

  preload: {
    build: {
      minify: MINIFY ? 'esbuild' : false,
      outDir: 'dist-electron/preload',
      externalizeDeps: true,
      rollupOptions: {
        input: {
          'browser.preload': resolve('src/preload/browser.preload.ts'),
          'tab.preload': resolve('src/preload/tab.preload.ts'),
          'extension.preload': resolve('src/preload/extension.preload.ts'),
        },
        output: {
          // electron-vite 6 / Vite 8 still supports this. The modern
          // replacement (codeSplitting: false) refuses to work with multiple
          // inputs, so we keep the deprecated option until toolchain catches up.
          inlineDynamicImports: false,
        },
      },
    },
    resolve: { alias: aliases },
  },
});
