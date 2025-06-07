// Type definitions to allow Jest's expect and Chai's expect to coexist
import * as chai from 'chai'

declare global {
  const expect: typeof chai.expect
}

// Export empty to make it a module
export {}
