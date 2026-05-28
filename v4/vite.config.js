import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';

const commitCount = (() => { try { return execSync('git rev-list --count HEAD').toString().trim().padStart(3, '0'); } catch(e) { return '000'; } })();
const buildDate = new Date().toISOString().slice(0,10).replace(/-/g,'');
const buildNum = 'v4-' + commitCount + '-' + buildDate;

export default defineConfig({
  define: { __BUILD__: JSON.stringify(buildNum) },
  base: '/v4/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Space Drift',
        short_name: 'SpaceDrift',
        description: 'Fly through space, dodge asteroids, collect treasures',
        theme_color: '#0a0a1a',
        background_color: '#0a0a1a',
        display: 'fullscreen',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          }
        ]
      }
    })
  ]
});
