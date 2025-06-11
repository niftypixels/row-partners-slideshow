import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  base: '/row-partners-slideshow/',
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
