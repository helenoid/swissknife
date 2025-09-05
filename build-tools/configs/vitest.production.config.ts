import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'production',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup/production.setup.ts'],
    testTimeout: 30000,
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'test/**',
        'dist/**',
        '**/*.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  esbuild: {
    target: 'node18'
  }
})