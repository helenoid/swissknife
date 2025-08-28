// SwissKnife API Index
// This file provides the main exports for the SwissKnife API

/**
 * @fileoverview SwissKnife - Unified AI-powered development suite
 * @version 0.0.53
 * @author Benjamin Barber <starworks5@gmail.com>
 */

// Core CLI exports
export { CLI } from './cli'
export { CommandRegistry } from './command-registry'

// Shared system exports  
export * from './shared'

// AI inference exports
export * from './ai'

// Configuration exports
export * from './config'

// Utility exports
export * from './utils'

/**
 * SwissKnife version information
 */
export const VERSION = '0.0.53'

/**
 * Main SwissKnife class
 */
export class SwissKnife {
  /**
   * Initialize SwissKnife with configuration
   */
  constructor(config?: any) {
    // Implementation will be added
  }

  /**
   * Get version information
   */
  static getVersion(): string {
    return VERSION
  }
}