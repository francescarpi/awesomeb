import { defineConfig } from 'astro/config';
import icon from 'astro-icon'

export default defineConfig({
  integrations: [icon({
    iconDir: 'src/renderer/icons',
  })],
  output: 'static',
  srcDir: 'src/renderer',
  outDir: 'dist/renderer',
  vite: {
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
