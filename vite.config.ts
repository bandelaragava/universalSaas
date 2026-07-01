import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    proxy: {
<<<<<<< HEAD
      '/api/leads': {
        target: 'http://54.164.162.68',
=======
      '/api': {
        target: 'http://32.199.180.3:8080',
>>>>>>> 9251160 (updated)
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
          });
        },
      },
<<<<<<< HEAD
      '/api': {
        target: 'http://32.199.180.3:8080',
=======
      '/lap-api': {
        target: 'http://54.164.162.68',
>>>>>>> 9251160 (updated)
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
          });
        },
      },
      '/lap-api': {
        target: 'http://54.164.162.68',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lap-api/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
          });
        },
      },
    },
  },
})

