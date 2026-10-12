/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Puts the tiny theme script inline so the first paint doesn't wait for a request. The CSP allows it by hash,
// and test/unit/csp.test.ts fails if the file and the hash in vercel.json ever disagree.
function inlineThemeInit(): Plugin {
  return {
    name: 'inline-theme-init',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const code = readFileSync('public/theme-init.js', 'utf8');
        return html.replace('<script src="/theme-init.js"></script>', () => '<script>' + code + '</script>');
      },
    },
  };
}

// Asks the browser for the main font file up front, so the first paint uses it.
function preloadFont(): Plugin {
  return {
    name: 'preload-main-font',
    transformIndexHtml(_html, ctx) {
      const file = Object.keys(ctx.bundle ?? {}).find((f) => /bricolage-grotesque-latin-wght-normal.*\.woff2$/.test(f));
      if (!file) return [];
      return [{ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${file}`, crossorigin: '' }, injectTo: 'head' }];
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    inlineThemeInit(),
    preloadFont(),
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
