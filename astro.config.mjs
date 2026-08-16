import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import fs from 'fs';

const localesDir = path.resolve('src/shared/i18n/locales');

function serveLocalesMiddleware() {
  return {
    name: 'awesomeb:serve-locales',
    configureServer(server) {
      server.middlewares.use('/locales', (req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        const filePath = path.join(localesDir, url);
        if (!filePath.startsWith(localesDir)) {
          next();
          return;
        }
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(filePath, 'utf-8'));
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  integrations: [icon({ iconDir: 'src/renderer/icons' })],

  output: 'static',
  srcDir: 'src/renderer',
  outDir: 'dist-electron/renderer',

  build: {
    assetsPrefix: '../',
  },

  vite: {
    plugins: [
      tailwindcss(),
      serveLocalesMiddleware(),
      viteStaticCopy({
        targets: [
          {
            src: path.resolve('src/shared/i18n/locales/*/*.json'),
            dest: 'locales',
          },
        ],
      }),
    ],
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
