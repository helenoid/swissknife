import { defineConfig } from 'vitest/config'

// Workspace configuration for all projects
export default defineConfig({
  test: {
    // Global test configuration
    globals: true,
    setupFiles: ['./test/setup.ts'],
    testTimeout: 15000,
    
    // Workspace projects
    projects: [
      // CLI project
      {
        name: 'cli',
        test: {
          environment: 'node',
          include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
          exclude: ['src/**/*.browser.{test,spec}.{js,ts,jsx,tsx}']
        }
      },
      
      // Web GUI project  
      {
        name: 'web',
        test: {
          environment: 'happy-dom',
          include: ['web/**/*.{test,spec}.{js,ts,jsx,tsx}'],
          browser: {
            enabled: false // Use happy-dom for faster web tests
          }
        }
      },
      
      // IPFS Accelerate project (Node tests)
      {
        name: 'ipfs-node',
        test: {
          environment: 'node', 
          include: ['ipfs_accelerate_js/test/**/*.{test,spec}.{js,ts,jsx,tsx}'],
          exclude: ['ipfs_accelerate_js/test/**/*.browser.{test,spec}.{js,ts,jsx,tsx}']
        }
      },
      
      // IPFS Accelerate project (Browser tests for WebGPU)
      {
        name: 'ipfs-browser',
        test: {
          environment: 'happy-dom',
          include: ['ipfs_accelerate_js/test/**/*.browser.{test,spec}.{js,ts,jsx,tsx}'],
          browser: {
            enabled: true,
            provider: 'playwright',
            name: 'chromium',
            headless: true
          }
        }
      },
      
      // Integration tests
      {
        name: 'integration',
        test: {
          environment: 'happy-dom',
          include: ['test/integration/**/*.{test,spec}.{js,ts,jsx,tsx}']
        }
      },
      
      // Browser-specific AI inference tests
      {
        name: 'ai-browser',
        test: {
          environment: 'happy-dom',
          include: ['test/browser/**/*.{test,spec}.{js,ts,jsx,tsx}'],
          browser: {
            enabled: true,
            provider: 'playwright',
            name: 'chromium',
            headless: true
          },
          testTimeout: 30000
        }
      }
    ]
  },
  
  resolve: {
    alias: {
      '@': './src',
      '@web': './web/src', 
      '@ipfs': './ipfs_accelerate_js/src'
    }
  }
})