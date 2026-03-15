import { defineConfig } from 'vite'
import { name } from './package.json'

// https://vite.dev/config/
export default defineConfig({
  base: `/${name}/`,
  mode: process.env.CLOUDFLARE ? 'cloudflare' : 'production',
  build: {
    rollupOptions: {
      external: ['gsap'],
      output: {
        format: 'iife',
        globals: {
          'gsap': 'gsap'
        }
      }
    }
  }
})
