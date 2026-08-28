import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Base path matches the GitHub Pages repo name (FinLingDivMap) so built asset
// URLs resolve correctly at https://<user>.github.io/FinLingDivMap/
export default defineConfig({
  base: '/FinLingDivMap/',
  plugins: [react()],
})
