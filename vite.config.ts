import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// VITE_BASE_PATH is set by CI to '/Trips/' for GitHub Pages
const base = process.env.VITE_BASE_PATH ?? '/'
const anthropicKey = process.env.VITE_ANTHROPIC_KEY ?? ''

export default defineConfig({
  base,
  define: {
    // Explicit replacement so the key is always embedded correctly
    'import.meta.env.VITE_ANTHROPIC_KEY': JSON.stringify(anthropicKey),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      base,
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'weather-cache', expiration: { maxAgeSeconds: 1800 } },
          },
          {
            urlPattern: /^https:\/\/geocoding-api\.open-meteo\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'geo-cache', expiration: { maxAgeSeconds: 86400 } },
          },
        ],
      },
      manifest: {
        name: 'Viaticum',
        short_name: 'Viaticum',
        description: 'Gerencie sua viagem juntos',
        theme_color: '#4f46e5',
        background_color: '#f9fafb',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
