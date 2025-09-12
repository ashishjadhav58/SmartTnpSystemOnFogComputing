import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/

export default defineConfig({
  build: {
    outDir: 'build'   // then Vercel output dir should be 'build'
  }
})