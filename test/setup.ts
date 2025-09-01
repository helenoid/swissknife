// Global test setup for Vitest
import { vi } from 'vitest'

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NODE_ENV: 'test',
    SWISSKNIFE_ENV: 'test'
  },
  cwd: () => '/tmp',
  argv: ['node', 'test']
}))

// Mock common Node.js modules for browser testing
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn()
}))

vi.mock('path', async () => {
  const actual = await vi.importActual('path-browserify')
  return actual
})

// Mock crypto for consistent testing
vi.mock('crypto', async () => {
  const actual = await vi.importActual('crypto-browserify')
  return actual
})

// Setup global objects that might be needed
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'test-agent',
    gpu: {
      requestAdapter: vi.fn(() => Promise.resolve(null))
    }
  },
  writable: true
})

// Mock WebGPU for AI inference testing
Object.defineProperty(window, 'GPU', {
  value: class MockGPU {
    requestAdapter = vi.fn(() => Promise.resolve({
      requestDevice: vi.fn(() => Promise.resolve({
        createShaderModule: vi.fn(),
        createBuffer: vi.fn(),
        createComputePipeline: vi.fn(),
        createCommandEncoder: vi.fn(),
        queue: {
          submit: vi.fn(),
          writeBuffer: vi.fn()
        }
      }))
    }))
  },
  writable: true
})

// Setup console for better test output
console.info = vi.fn()
console.debug = vi.fn()
console.warn = vi.fn()

// Increase timeout for AI-related tests
vi.setConfig({ 
  testTimeout: 30000,
  hookTimeout: 10000 
})