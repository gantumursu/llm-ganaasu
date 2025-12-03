import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'c29e40feaba3.ngrok-free.app',
      '.ngrok-free.app',
      '.ngrok.io'
    ]
  }
})
