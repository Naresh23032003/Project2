/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'theme-init.js'],
      manifest: {
        name: 'Dripcheck',
        short_name: 'Dripcheck',
        description: 'Find forgotten subscriptions in your bank statement. Runs on your device. Nothing is uploaded.',
        theme_color: '#C8102E',
        background_color: '#F5F6F8',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  build: { target: 'es2022', sourcemap: false },
  worker: { format: 'es' },
  test: {
    include: ['test/unit/**/*.test.ts', 'test/golden/**/*.test.ts'],
    environment: 'node',
  },
});
