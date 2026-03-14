import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { name } from './package.json'

// https://vite.dev/config/
export default defineConfig({
  base: `/${name}/`,
  mode: process.env.CLOUDFLARE ? 'cloudflare' : 'production',
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['gsap'],
      output: {
        globals: {
          'gsap': 'gsap'
        }
      }
    }
  }
})
