// Shared TypeScript interfaces for SwissKnife unified components

export interface SwissKnifeConfig {
  ai: {
    providers: Record<string, AIProviderConfig>
    defaultModel: string
    apiKeys: Record<string, string>
  }
  ipfs: {
    gateway: string
    accelerate: boolean
    nodes: string[]
  }
  web: {
    theme: 'day' | 'sunset' | 'night'
    layout: 'desktop' | 'mobile'
    port: number
  }
  cli: {
    verbose: boolean
    outputFormat: 'json' | 'text' | 'table'
    autoComplete: boolean
  }
}

export interface AIProviderConfig {
  name: string
  apiUrl: string
  apiKey?: string
  models: string[]
  enabled: boolean
}

// Event-driven communication between components
export interface SwissKnifeEvents {
  'cli:command': { command: string, args: string[], cwd?: string }
  'cli:response': { output: string, exitCode: number, command: string }
  'web:app-launch': { appId: string, params?: any }
  'web:app-close': { appId: string }
  'ipfs:upload': { file: File, callback: (hash: string) => void }
  'ipfs:download': { hash: string, callback: (data: Uint8Array) => void }
  'ai:inference': { model: string, prompt: string, callback: (response: string) => void }
  'ai:inference-start': { requestId: string, model: string }
  'ai:inference-progress': { requestId: string, progress: number }
  'ai:inference-complete': { requestId: string, response: string }
  'config:update': { component: keyof SwissKnifeConfig, config: any }
  'system:status': { component: string, status: 'online' | 'offline' | 'error' }
}

// Plugin system interfaces
export interface SwissKnifePlugin {
  name: string
  version: string
  description: string
  components: ('cli' | 'web' | 'ipfs')[]
  dependencies?: string[]
  install(): Promise<void>
  uninstall(): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
}

// Application registry for virtual desktop
export interface DesktopApp {
  id: string
  name: string
  description: string
  icon: string
  component: string
  category: 'productivity' | 'development' | 'ai' | 'system' | 'entertainment'
  shortcut?: string
  windowOptions?: {
    width?: number
    height?: number
    resizable?: boolean
    maximizable?: boolean
    minimizable?: boolean
  }
}

// Window management
export interface WindowState {
  id: string
  appId: string
  title: string
  x: number
  y: number
  width: number
  height: number
  minimized: boolean
  maximized: boolean
  focused: boolean
  zIndex: number
}

// File system interfaces
export interface FileSystemNode {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  lastModified?: Date
  children?: FileSystemNode[]
}

// Terminal interfaces
export interface TerminalSession {
  id: string
  title: string
  cwd: string
  history: string[]
  active: boolean
  pid?: number
}

// AI model interfaces
export interface AIModel {
  id: string
  name: string
  provider: string
  type: 'text' | 'image' | 'audio' | 'multimodal'
  size: string
  parameters: number
  contextLength: number
  available: boolean
  local: boolean
}

// IPFS interfaces
export interface IPFSNode {
  id: string
  addresses: string[]
  protocols: string[]
  connected: boolean
  bandwidth: {
    upload: number
    download: number
  }
}

export interface IPFSFile {
  hash: string
  name: string
  size: number
  type: string
  pinned: boolean
  uploaded: Date
}