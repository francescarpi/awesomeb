import { defineConfig } from 'astro/config';

export default defineConfig({
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
  }
});
