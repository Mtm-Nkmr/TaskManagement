import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 開発サーバー専用のCORS回避。/api 宛てのリクエストをバックエンド(8080)へ転送する。
    // ※本番環境では別途CORS対応が必要（バックエンドの許可設定 or リバースプロキシ）。
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
