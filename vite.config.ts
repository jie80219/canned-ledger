import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import pkg from './package.json'

// 相對路徑 + hash router：不論 repo 名稱為何都能直接部署到 GitHub Pages
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    vue(),
    // iOS 加入主畫面時抓不到外部圖示檔（實測只有內嵌的 data URI 有效）
    {
      name: 'inline-touch-icon',
      transformIndexHtml: (html) =>
        html.replace(/href="\.\/apple-touch-icon\.png[^"]*"/, `href="data:image/png;base64,${readFileSync('public/apple-touch-icon.png').toString('base64')}"`),
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '囤囤帳 TunTun',
        short_name: '囤囤帳',
        description: '離線可用的極簡記帳，資料只存在你的裝置',
        lang: 'zh-Hant-TW',
        theme_color: '#7a9a6b',
        background_color: '#f6f4ee',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192.png?v=2', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png?v=2', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
  },
})
