import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  root: 'src/frontend',
  plugins: [svelte()],
  build: {
    outDir: '../backend/GraphVisualizer/wwwroot',
  },
});