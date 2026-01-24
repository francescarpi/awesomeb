import { defineConfig } from 'astro/config';
import icon from 'astro-icon'
import tailwindcss from "@tailwindcss/vite";
import electron from "astro-electron";
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'

const commonAliases = {
  "@": path.resolve("src/main"),
  "~": path.resolve("src/shared")
}

export default defineConfig({
  integrations: [
    icon({
      iconDir: 'src/renderer/icons',
    }),
    electron({
      main: {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
          },
          plugins: [
            viteStaticCopy({
              targets: [
                {
                  src: 'src/main/assets/icons',
                  dest: 'assets',
                },
              ],
            }),
          ],
          resolve: {
            alias: commonAliases,
          }
        },
      },
      preload: {
        vite: {
          build: {
            minify: 'esbuild',
            rollupOptions: {
              input: {
                'preload/browser': 'src/preload/browser.ts',
              },
            },
          },
          resolve: {
            alias: commonAliases,
          }
        }
      },
      renderer: {}
    })],
  output: 'static',
  srcDir: 'src/renderer',
  outDir: 'dist/renderer',
  build: {
    assetsPrefix: '../',
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        ...commonAliases,
        "@preload": "./src/preload",
        "@renderer": "./src/renderer",
      }
    }
  },
  devToolbar: {
    enabled: false
  },
});
