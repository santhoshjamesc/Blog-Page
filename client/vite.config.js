import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const rootDir = path.resolve(__dirname, '..')
const env = loadEnv('', rootDir, '')

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: "http://localhost:8080",  // Fixed: was "htts//:localhost:8080"
        changeOrigin: true,
        secure: false,
      },
    },
  },
})