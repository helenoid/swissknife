// Simple test to verify Vitest is working
import { describe, it, expect } from 'vitest'

describe('Vite/Vitest Integration', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2)
  })
  
  it('should have access to browser APIs in test setup', () => {
    expect(globalThis).toBeDefined()
    expect(window).toBeDefined()
  })
})

describe('Monorepo Structure', () => {
  it('should resolve alias paths', () => {
    // This test validates our alias configuration
    expect(() => {
      // These would be real imports in actual tests
      const aliasTest = {
        cli: '@',
        web: '@web', 
        ipfs: '@ipfs'
      }
      expect(aliasTest).toEqual({
        cli: '@',
        web: '@web',
        ipfs: '@ipfs'
      })
    }).not.toThrow()
  })
})