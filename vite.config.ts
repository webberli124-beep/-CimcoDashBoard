import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'DEV_', 'SERVER_'])
  const devPort = Number(env.DEV_PORT) || 5199
  const serverPort = Number(env.SERVER_PORT) || 3002

  return {
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths(),
    ],
    server: {
      port: devPort,
      proxy: {
        '/api': {
          target: `http://localhost:${serverPort}`,
          changeOrigin: true,
        },
      },
    },
    build: {
      sourcemap: false,
      target: 'es2020',
    },
  }
})
