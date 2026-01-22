import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expose ke network local
    proxy: {
      // Proxy semua request yang diawali /api ke Backend IP
      '/api': {
        target: 'http://165.245.187.238:3000',
        changeOrigin: true,
        secure: false,
        // Optional: Rewrite jika backend tidak menggunakan prefix /api, 
        // tapi berdasarkan kode server/index.js Anda, backend MENGGUNAKAN /api, jadi rewrite tidak diperlukan.
      }
    }
  }
})