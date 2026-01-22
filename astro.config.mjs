import { defineConfig } from 'astro/config';
import icon from 'astro-icon'
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [icon({
    iconDir: 'src/renderer/icons',
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
        "@main/*": ["./src/main/*"],
        "@shared/*": ["./src/shared/*"]
      }
    }
  },
  devToolbar: {
    enabled: false
  },
});
