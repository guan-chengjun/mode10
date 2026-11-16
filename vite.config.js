import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base 使用相对路径，构建产物可部署到任意子目录 / 静态服务器
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: false
  },
  build: {
    target: 'es2018',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          react: ['react', 'react-dom', 'zustand']
        }
      }
    }
  }
})
