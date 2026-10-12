import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Builds only the prerender entry for Node. It never ships to the browser.
export default defineConfig({
  plugins: [react()],
  build: { ssr: 'src/prerender.tsx', outDir: 'dist-ssr', emptyOutDir: true, target: 'node20', rollupOptions: { output: { format: 'es' } } },
});
