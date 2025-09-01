// Shared constants for SwissKnife components

// Application IDs for virtual desktop
export const APP_IDS = {
  TERMINAL: 'terminal',
  VIBECODE: 'vibecode',
  AI_CHAT: 'ai-chat',
  FILE_MANAGER: 'file-manager',
  TASK_MANAGER: 'task-manager',
  MODEL_BROWSER: 'model-browser',
  IPFS_EXPLORER: 'ipfs-explorer',
  DEVICE_MANAGER: 'device-manager',
  SETTINGS: 'settings',
  MCP_CONTROL: 'mcp-control',
  API_KEYS: 'api-keys',
  AI_CRON: 'ai-cron',
  NAVI: 'navi',
  MUSIC_STUDIO: 'music-studio'
} as const

// Default configuration
export const DEFAULT_CONFIG = {
  ai: {
    providers: {},
    defaultModel: 'gpt-3.5-turbo',
    apiKeys: {}
  },
  ipfs: {
    gateway: 'https://ipfs.io/ipfs/',
    accelerate: true,
    nodes: ['localhost:5001']
  },
  web: {
    theme: 'day' as const,
    layout: 'desktop' as const,
    port: 3001
  },
  cli: {
    verbose: false,
    outputFormat: 'text' as const,
    autoComplete: true
  }
}

// Supported AI providers
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
  OLLAMA: 'ollama',
  LOCAL: 'local'
} as const

// File type mappings
export const FILE_TYPES = {
  TEXT: ['txt', 'md', 'json', 'yml', 'yaml', 'xml', 'csv'],
  CODE: ['js', 'ts', 'jsx', 'tsx', 'py', 'go', 'rs', 'c', 'cpp', 'java', 'php'],
  IMAGE: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'],
  AUDIO: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'],
  VIDEO: ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv'],
  ARCHIVE: ['zip', 'tar', 'gz', 'rar', '7z', 'bz2'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
} as const

// Window constraints
export const WINDOW_CONSTRAINTS = {
  MIN_WIDTH: 300,
  MIN_HEIGHT: 200,
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  DEFAULT_WIDTH: 800,
  DEFAULT_HEIGHT: 600,
  TASKBAR_HEIGHT: 50,
  TITLE_BAR_HEIGHT: 30
} as const

// Theme colors
export const THEMES = {
  day: {
    primary: '#ffffff',
    secondary: '#f5f5f5',
    accent: '#007acc',
    text: '#333333',
    border: '#cccccc',
    shadow: 'rgba(0, 0, 0, 0.1)'
  },
  sunset: {
    primary: '#2a2d3a',
    secondary: '#363947',
    accent: '#ff6b6b',
    text: '#ffffff',
    border: '#4a4e5e',
    shadow: 'rgba(0, 0, 0, 0.3)'
  },
  night: {
    primary: '#1a1b26',
    secondary: '#24252e',
    accent: '#7aa2f7',
    text: '#c0caf5',
    border: '#414868',
    shadow: 'rgba(0, 0, 0, 0.5)'
  }
} as const

// Event priorities
export const EVENT_PRIORITIES = {
  SYSTEM: 0,
  CLI: 1,
  WEB: 2,
  IPFS: 3,
  USER: 4
} as const

// Performance thresholds
export const PERFORMANCE = {
  INFERENCE_TIMEOUT: 30000, // 30 seconds
  FILE_UPLOAD_TIMEOUT: 60000, // 1 minute
  CLI_COMMAND_TIMEOUT: 120000, // 2 minutes
  DEBOUNCE_DELAY: 300, // 300ms
  THROTTLE_LIMIT: 100, // 100ms
  MAX_RETRIES: 3
} as const

// IPFS configuration
export const IPFS_CONFIG = {
  DEFAULT_GATEWAY: 'https://ipfs.io/ipfs/',
  LOCAL_GATEWAY: 'http://localhost:8080/ipfs/',
  PIN_TIMEOUT: 30000,
  UPLOAD_CHUNK_SIZE: 1024 * 1024, // 1MB chunks
  MAX_FILE_SIZE: 100 * 1024 * 1024 // 100MB max
} as const

// AI model categories
export const MODEL_CATEGORIES = {
  TEXT: 'text',
  IMAGE: 'image', 
  AUDIO: 'audio',
  MULTIMODAL: 'multimodal',
  CODE: 'code',
  EMBEDDING: 'embedding'
} as const

// CLI command categories
export const CLI_CATEGORIES = {
  FILE: 'file',
  AI: 'ai', 
  IPFS: 'ipfs',
  SYSTEM: 'system',
  DEV: 'dev',
  HELP: 'help'
} as const

// Desktop app categories  
export const APP_CATEGORIES = {
  PRODUCTIVITY: 'productivity',
  DEVELOPMENT: 'development', 
  AI: 'ai',
  SYSTEM: 'system',
  ENTERTAINMENT: 'entertainment'
} as const

// Keyboard shortcuts
export const SHORTCUTS = {
  TOGGLE_TERMINAL: 'Ctrl+`',
  TOGGLE_AI_CHAT: 'Ctrl+Shift+A',
  TOGGLE_FILE_MANAGER: 'Ctrl+Shift+F',
  TOGGLE_SETTINGS: 'Ctrl+,',
  CLOSE_WINDOW: 'Ctrl+W',
  MINIMIZE_WINDOW: 'Ctrl+M',
  MAXIMIZE_WINDOW: 'Ctrl+Shift+M',
  REFRESH: 'F5',
  HELP: 'F1'
} as const

// API endpoints
export const API_ENDPOINTS = {
  CLI: '/api/cli',
  FILES: '/api/files',
  IPFS: '/api/ipfs', 
  AI: '/api/ai',
  CONFIG: '/api/config',
  SYSTEM: '/api/system'
} as const

// Error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR', 
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  IPFS_ERROR: 'IPFS_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR'
} as const

export type AppId = typeof APP_IDS[keyof typeof APP_IDS]
export type AIProvider = typeof AI_PROVIDERS[keyof typeof AI_PROVIDERS]
export type FileType = keyof typeof FILE_TYPES
export type Theme = keyof typeof THEMES
export type ModelCategory = typeof MODEL_CATEGORIES[keyof typeof MODEL_CATEGORIES]
export type AppCategory = typeof APP_CATEGORIES[keyof typeof APP_CATEGORIES]
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]