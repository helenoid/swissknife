// Main exports for SwissKnife shared components
// This provides a unified interface for all shared functionality

// Type definitions
export * from './types/index.js'

// Event system
export * from './events/index.js'

// Utilities
export * from './utils/index.js'

// Constants
export * from './constants/index.js'

// AI providers
export * from './ai/index.js'

// Configuration management
export * from './config/index.js'

// Version information
export const SWISSKNIFE_VERSION = '0.0.53'
export const SHARED_VERSION = '1.0.0'

// Component information
export const COMPONENTS = {
  CLI: 'cli',
  WEB: 'web',
  IPFS: 'ipfs'
} as const

// Quick access to commonly used exports
export {
  // Events
  eventBus,
  events,
  createComponentEventBus,
  
  // Configuration
  configManager,
  config,
  
  // AI
  aiManager,
  initializeDefaultProviders,
  
  // Constants
  APP_IDS,
  DEFAULT_CONFIG,
  AI_PROVIDERS,
  THEMES,
  
  // Utils
  formatFileSize,
  formatRelativeTime,
  debounce,
  throttle,
  deepClone,
  mergeDeep
} from './index.js'

// Type re-exports for convenience
export type {
  SwissKnifeConfig,
  SwissKnifeEvents,
  DesktopApp,
  WindowState,
  AIModel,
  AIProviderConfig,
  SwissKnifePlugin
} from './types/index.js'