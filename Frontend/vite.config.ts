import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/webappchat/',
  server: {
    historyApiFallback: true,
  },
  build: {
    outDir: path.resolve(__dirname, '../Backend/ChatApp.API/wwwroot/webappchat'),
    emptyOutDir: true,
  },
})
