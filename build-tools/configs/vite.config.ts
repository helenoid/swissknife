import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // Root configuration for the monorepo
  root: '.',
  
  // Build configuration
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        cli: resolve(__dirname, 'src/entrypoints/cli.tsx'),
        web: resolve(__dirname, 'web/src/index.ts'),
        ipfs: resolve(__dirname, 'ipfs_accelerate_js/src/index.ts')
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        'node:fs',
        'node:path',
        'node:url',
        'node:process',
        'react',
        'react-dom'
      ]
    },
    target: 'node18'
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true,
    fs: {
      allow: ['..']
    }
  },

  // Module resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@web': resolve(__dirname, 'web/src'),
      '@ipfs': resolve(__dirname, 'ipfs_accelerate_js/src'),
      // Browser polyfills
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'path': 'path-browserify',
      'os': 'os-browserify',
      'process': 'process/browser',
      'buffer': 'buffer',
      'util': 'util'
    }
  },

  // Define global constants
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },

  // Optimized dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@anthropic-ai/sdk',
      'openai',
      'crypto-browserify',
      'stream-browserify',
      'path-browserify',
      'os-browserify',
      'process',
      'buffer',
      'util'
    ]
  },

  // Environment variables
  envPrefix: 'SWISSKNIFE_',

  // Plugin configuration will be added based on specific needs
  plugins: []
})