import { defineConfig } from 'vite'
import { resolve } from 'path'

// CLI-specific Vite configuration
export default defineConfig({
  root: '.',
  
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, '../../src/entrypoints/cli.tsx'),
      name: 'SwissKnifeCLI',
      fileName: 'cli',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        // Node.js built-ins
        'fs', 'path', 'os', 'crypto', 'stream', 'util', 'url',
        'child_process', 'readline', 'events', 'process',
        // CLI-specific externals
        'ink', 'react', 'commander', 'chalk', 'ora',
        '@anthropic-ai/sdk', 'openai', 'node-fetch'
      ]
    },
    target: 'node18',
    ssr: true,
    sourcemap: true
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      '@web': resolve(__dirname, '../../web/src'),
      '@ipfs': resolve(__dirname, '../../ipfs_accelerate_js/src')
    }
  },
  
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.SWISSKNIFE_CLI': '"true"'
  }
})