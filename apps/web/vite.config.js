import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  }
})
// apps/web/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Recharts is large (350KB) — its own chunk
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          // React core
          if (id.includes('node_modules/react') || id.includes('react-dom')) return 'vendor-react';
          // Heavy pages — only loaded when navigated to
          if (id.includes('/pages/MonteCarlo') || id.includes('/pages/AIAdvisor'))
            return 'pages-heavy-ai';
          if (id.includes('/pages/Infra') || id.includes('/pages/Security'))
            return 'pages-infra';
          if (id.includes('/pages/Tax') || id.includes('/pages/Benchmark'))
            return 'pages-analytics';
        },
        chunkSizeWarningLimit: 200,
      }
    }
  }
});
