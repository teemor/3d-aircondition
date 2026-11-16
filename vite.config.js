import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_PROXY_TARGET || 'http://10.223.20.19'
  return { plugins: [vue()], server: { proxy: { '/prod-api': { target, changeOrigin: true }, '/mybucket': { target, changeOrigin: true } } } }
})
