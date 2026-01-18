import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  srcDir: 'src/renderer',
  outDir: 'dist/renderer'
});
