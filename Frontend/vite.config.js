import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const backendEnv = loadEnv(mode, resolve(process.cwd(), '../Backend'), '')
  const backendPort = Number.parseInt(backendEnv.PORT, 10) || 3000
  const backendTarget = `http://127.0.0.1:${backendPort}`

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': { target: backendTarget, changeOrigin: true },
        '/imagenes': { target: backendTarget, changeOrigin: true }
      }
    }
  }
})
