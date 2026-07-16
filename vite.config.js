import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import stylex from '@stylexjs/unplugin';
import { VitePWA } from 'vite-plugin-pwa';

// Social cards need absolute URLs; the production origin is only known at
// build time (Vercel env). Locally nothing is injected — the relative-safe
// tags in index.html stay valid on their own.
const siteOrigin = (() => {
  const raw =
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    '';
  if (!raw) return '';
  return (raw.startsWith('http') ? raw : `https://${raw}`).replace(/\/$/, '');
})();

const socialUrls = () => ({
  name: 'inject-social-urls',
  transformIndexHtml(html) {
    if (!siteOrigin) return html;
    return {
      html: html.replace(
        '<meta name="twitter:card" content="summary">',
        '<meta name="twitter:card" content="summary_large_image">',
      ),
      tags: [
        { tag: 'link', attrs: { rel: 'canonical', href: `${siteOrigin}/` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:url', content: `${siteOrigin}/` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image', content: `${siteOrigin}/api/og` }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:type', content: 'image/png' }, injectTo: 'head' },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: '주간 계획표 주간 시간표 미리보기' }, injectTo: 'head' },
        { tag: 'meta', attrs: { name: 'twitter:image', content: `${siteOrigin}/api/og` }, injectTo: 'head' },
      ],
    };
  },
});

export default defineConfig({
  cacheDir: '.vite',
  plugins: [
    stylex.vite({ useCSSLayers: true }),
    react(),
    socialUrls(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '주간 계획표',
        short_name: '주간 계획표',
        description: '주간 시간표 · Weekly Planner',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#F6F6F7',
        theme_color: '#F6F6F7',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App shell only — Instant owns its own IndexedDB offline cache + sync.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-fonts',
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: { port: 3000 },
  preview: { port: 3000 },
  build: {
    outDir: 'dist',
    target: 'es2022',
    sourcemap: true,
  },
});
