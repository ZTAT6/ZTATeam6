import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:4000',
      // Tránh bắt route SPA "/admin"; chỉ proxy các API dưới "/admin/"
      '/admin/': 'http://localhost:4000',
      // Proxy API cho teacher và student (chỉ các đường dẫn dưới prefix, không phải route SPA)
      '/teacher/': 'http://localhost:4000',
      '/student/': 'http://localhost:4000',
      '/me': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
      '/health/db': 'http://localhost:4000'
    }
  }
})
