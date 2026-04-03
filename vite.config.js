import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  define: {
    // Make contract address available without VITE_ prefix issues
    __CONTRACT_ADDRESS__: JSON.stringify(process.env.VITE_CONTRACT_ADDRESS || ''),
  }
})
