import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import imagemin from 'vite-plugin-imagemin'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [
      react(),
      tailwindcss(),
      isProd && imagemin({
        gzip: true,
        webp: { quality: 80 },
        avif: { quality: 70 },
        mozjpeg: { quality: 75 },
        pngquant: { quality: [0.7, 0.8] },
        svgo: {
          plugins: [
            { name: 'removeViewBox', active: false },
            { name: 'removeDimensions', active: true }
          ]
        }
      }),
      isProd && visualizer({ 
        open: false, 
        filename: 'dist/bundle-report.html',
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    server: {
      port: 5173,
      proxy: {
        '/api/interviews': {
          target: process.env.VITE_AI_API_URL || 'http://localhost:5055',
          changeOrigin: true
        },
        '/ws/interview': {
          target: process.env.VITE_AI_WS_URL || 'ws://localhost:5055',
          ws: true,
          changeOrigin: true
        },
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true
        },
        '/uploads': {
          target: 'http://localhost:5000',
          changeOrigin: true
        },
        '/ws': {
          target: 'ws://localhost:5000',
          ws: true,
          changeOrigin: true
        }
      }
    },
    build: {
      cssCodeSplit: true,
      modulePreload: { polyfill: false },
      reportCompressedSize: false,
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (id.includes('katex')) {
                return 'vendor-katex';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('@monaco-editor')) {
                return 'vendor-monaco';
              }
            }
          },
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
      legalComments: 'none'
    }
  };
});
