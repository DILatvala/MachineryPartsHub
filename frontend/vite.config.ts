import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'manager-noindex',
      transformIndexHtml(html) {
        if (process.env.VITE_ADMIN_ONLY !== 'true') return html

        return html
          .replace(/^\s*<link rel="canonical"[^>]*>\s*$/m, '')
          .replace(
            '<meta name="theme-color" content="#0d0d0d" />',
            '<meta name="theme-color" content="#0d0d0d" />\n    <meta name="robots" content="noindex, nofollow" />',
          )
      },
    },
  ],
})
