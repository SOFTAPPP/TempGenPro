import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    allowedHosts: true,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    // ⚡ Inline small assets as base64 to reduce HTTP round-trips
    assetsInlineLimit: 4096, // 4kb
    rollupOptions: {
      output: {
        // ⚡ Optimal chunk strategy for caching
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('framer-motion')) return 'vendor-framer';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
            if (id.includes('socket.io-client')) return 'vendor-socket';
            if (id.includes('axios')) return 'vendor-axios';
            return 'vendor-others';
          }
        },
        // ⚡ Stable filenames for long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  },
  // ⚡ Enable dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'framer-motion', 'lucide-react', 'socket.io-client'],
  },
})
