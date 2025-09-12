import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',        // ensures correct paths for assets on root domain
  build: {
    outDir: 'dist', // Vercel expects `dist` as output
  }
})
