import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  root: 'src/frontend',
  plugins: [svelte()],
  define: {
    'process.env': process.env // This line ensures environment variables are available
  },
  build: {
    outDir: '../backend/GraphVisualizer/wwwroot',
  },
});