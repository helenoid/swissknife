import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

// Browser-specific testing configuration for AI inference
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    
    // Browser testing enabled
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true,
      // Enable WebGPU and other experimental features
      launchOptions: {
        args: [
          '--enable-unsafe-webgpu',
          '--enable-features=Vulkan,WebAssemblyExperimentalFeatures',
          '--use-angle=vulkan',
          '--enable-webgl-developer-extensions',
          '--enable-webgl-draft-extensions'
        ]
      }
    },
    
    // Only run browser tests
    include: [
      'test/browser/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'ipfs_accelerate_js/test/**/*browser*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    
    testTimeout: 30000 // Longer timeout for AI operations
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@web': resolve(__dirname, 'web/src'),
      '@ipfs': resolve(__dirname, 'ipfs_accelerate_js/src'),
      'crypto': 'crypto-browserify',
      'stream': 'stream-browserify',
      'path': 'path-browserify',
      'os': 'os-browserify',
      'process': 'process/browser',
      'buffer': 'buffer',
      'util': 'util'
    }
  },
  
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': '"test"',
    'process.env.BROWSER_TEST': '"true"'
  }
})