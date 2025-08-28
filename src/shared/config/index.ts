// Configuration management for SwissKnife components
import { SwissKnifeConfig } from '../types/index.js'
import { DEFAULT_CONFIG } from '../constants/index.js'
import { eventBus } from '../events/index.js'
import { deepClone, mergeDeep } from '../utils/index.js'

export class ConfigManager {
  private config: SwissKnifeConfig
  private configPath: string | null = null
  private watchers: Set<(config: SwissKnifeConfig) => void> = new Set()

  constructor(initialConfig?: Partial<SwissKnifeConfig>) {
    this.config = mergeDeep(deepClone(DEFAULT_CONFIG), initialConfig || {})
    this.setupEventListeners()
  }

  // Get the complete configuration
  getConfig(): SwissKnifeConfig {
    return deepClone(this.config)
  }

  // Get configuration for a specific component
  getComponentConfig<K extends keyof SwissKnifeConfig>(component: K): SwissKnifeConfig[K] {
    return deepClone(this.config[component])
  }

  // Update configuration for a specific component
  updateComponentConfig<K extends keyof SwissKnifeConfig>(
    component: K, 
    updates: Partial<SwissKnifeConfig[K]>
  ): void {
    const oldConfig = deepClone(this.config[component])
    this.config[component] = mergeDeep(this.config[component], updates)
    
    // Emit configuration update event
    eventBus.emit('config:update', { component, config: this.config[component] })
    
    // Notify watchers
    this.notifyWatchers()
    
    // Auto-save if config path is set
    if (this.configPath) {
      this.saveConfig().catch(error => {
        console.error('Failed to auto-save configuration:', error)
      })
    }

    console.log(`[ConfigManager] Updated ${component} config:`, {
      old: oldConfig,
      new: this.config[component]
    })
  }

  // Watch for configuration changes
  watch(callback: (config: SwissKnifeConfig) => void): () => void {
    this.watchers.add(callback)
    
    // Return unwatch function
    return () => {
      this.watchers.delete(callback)
    }
  }

  // Load configuration from file (Node.js only)
  async loadConfig(path: string): Promise<void> {
    try {
      // In browser environment, this would use localStorage or IndexedDB
      if (typeof window !== 'undefined') {
        await this.loadConfigFromLocalStorage()
        return
      }

      // Node.js file system implementation
      const fs = await import('fs/promises')
      const configData = await fs.readFile(path, 'utf8')
      const loadedConfig = JSON.parse(configData)
      
      this.config = mergeDeep(deepClone(DEFAULT_CONFIG), loadedConfig)
      this.configPath = path
      
      this.notifyWatchers()
      console.log(`[ConfigManager] Loaded configuration from ${path}`)
    } catch (error) {
      console.warn(`[ConfigManager] Failed to load config from ${path}:`, error)
      // Continue with default configuration
    }
  }

  // Save configuration to file (Node.js only)
  async saveConfig(path?: string): Promise<void> {
    const targetPath = path || this.configPath
    if (!targetPath) {
      throw new Error('No configuration path specified')
    }

    try {
      // In browser environment, save to localStorage
      if (typeof window !== 'undefined') {
        await this.saveConfigToLocalStorage()
        return
      }

      // Node.js file system implementation
      const fs = await import('fs/promises')
      await fs.writeFile(targetPath, JSON.stringify(this.config, null, 2), 'utf8')
      
      this.configPath = targetPath
      console.log(`[ConfigManager] Saved configuration to ${targetPath}`)
    } catch (error) {
      console.error(`[ConfigManager] Failed to save config to ${targetPath}:`, error)
      throw error
    }
  }

  // Browser localStorage implementation
  private async loadConfigFromLocalStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('swissknife-config')
      if (stored) {
        const loadedConfig = JSON.parse(stored)
        this.config = mergeDeep(deepClone(DEFAULT_CONFIG), loadedConfig)
        this.notifyWatchers()
        console.log('[ConfigManager] Loaded configuration from localStorage')
      }
    } catch (error) {
      console.warn('[ConfigManager] Failed to load config from localStorage:', error)
    }
  }

  private async saveConfigToLocalStorage(): Promise<void> {
    try {
      localStorage.setItem('swissknife-config', JSON.stringify(this.config))
      console.log('[ConfigManager] Saved configuration to localStorage')
    } catch (error) {
      console.error('[ConfigManager] Failed to save config to localStorage:', error)
      throw error
    }
  }

  // Reset configuration to defaults
  resetConfig(): void {
    this.config = deepClone(DEFAULT_CONFIG)
    this.notifyWatchers()
    console.log('[ConfigManager] Reset configuration to defaults')
  }

  // Validate configuration
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate AI configuration
    if (this.config.ai.defaultModel && !this.config.ai.providers[this.getProviderForModel(this.config.ai.defaultModel)]) {
      errors.push(`Default model "${this.config.ai.defaultModel}" has no configured provider`)
    }

    // Validate web configuration
    if (this.config.web.port < 1 || this.config.web.port > 65535) {
      errors.push('Web port must be between 1 and 65535')
    }

    // Validate IPFS configuration
    if (this.config.ipfs.nodes.length === 0) {
      errors.push('At least one IPFS node must be configured')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Export configuration for sharing
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }

  // Import configuration from JSON
  importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson)
      this.config = mergeDeep(deepClone(DEFAULT_CONFIG), importedConfig)
      this.notifyWatchers()
      console.log('[ConfigManager] Imported configuration')
    } catch (error) {
      throw new Error(`Invalid configuration JSON: ${error}`)
    }
  }

  // Helper methods
  private notifyWatchers(): void {
    const config = this.getConfig()
    this.watchers.forEach(callback => {
      try {
        callback(config)
      } catch (error) {
        console.error('[ConfigManager] Error in config watcher:', error)
      }
    })
  }

  private getProviderForModel(model: string): string {
    // Simple heuristic to determine provider from model name
    if (model.startsWith('gpt-')) return 'openai'
    if (model.startsWith('claude-')) return 'anthropic'
    if (model.startsWith('llama') || model.startsWith('codellama')) return 'ollama'
    return 'openai' // default
  }

  private setupEventListeners(): void {
    // Listen for configuration update requests from other components
    eventBus.on('config:update', (data) => {
      if (data.component && data.config) {
        this.updateComponentConfig(data.component, data.config)
      }
    })
  }

  // Environment-specific helpers
  isNodeEnvironment(): boolean {
    return typeof window === 'undefined' && typeof process !== 'undefined'
  }

  isBrowserEnvironment(): boolean {
    return typeof window !== 'undefined'
  }

  // Get configuration directory
  getConfigDirectory(): string {
    if (this.isNodeEnvironment()) {
      const os = require('os')
      const path = require('path')
      return path.join(os.homedir(), '.swissknife')
    }
    return 'localStorage' // Browser uses localStorage
  }

  // Get default configuration file path
  getDefaultConfigPath(): string {
    if (this.isNodeEnvironment()) {
      const path = require('path')
      return path.join(this.getConfigDirectory(), 'config.json')
    }
    return 'localStorage'
  }
}

// Global configuration manager instance
export const configManager = new ConfigManager()

// Convenience functions for component-specific configuration
export const config = {
  // AI configuration helpers
  ai: {
    get: () => configManager.getComponentConfig('ai'),
    update: (updates: Partial<SwissKnifeConfig['ai']>) => configManager.updateComponentConfig('ai', updates),
    addProvider: (name: string, provider: SwissKnifeConfig['ai']['providers'][string]) => {
      const aiConfig = configManager.getComponentConfig('ai')
      aiConfig.providers[name] = provider
      configManager.updateComponentConfig('ai', aiConfig)
    },
    removeProvider: (name: string) => {
      const aiConfig = configManager.getComponentConfig('ai')
      delete aiConfig.providers[name]
      configManager.updateComponentConfig('ai', aiConfig)
    }
  },

  // Web configuration helpers
  web: {
    get: () => configManager.getComponentConfig('web'),
    update: (updates: Partial<SwissKnifeConfig['web']>) => configManager.updateComponentConfig('web', updates),
    setTheme: (theme: SwissKnifeConfig['web']['theme']) => {
      configManager.updateComponentConfig('web', { theme })
    },
    setPort: (port: number) => {
      configManager.updateComponentConfig('web', { port })
    }
  },

  // IPFS configuration helpers
  ipfs: {
    get: () => configManager.getComponentConfig('ipfs'),
    update: (updates: Partial<SwissKnifeConfig['ipfs']>) => configManager.updateComponentConfig('ipfs', updates),
    addNode: (node: string) => {
      const ipfsConfig = configManager.getComponentConfig('ipfs')
      if (!ipfsConfig.nodes.includes(node)) {
        ipfsConfig.nodes.push(node)
        configManager.updateComponentConfig('ipfs', ipfsConfig)
      }
    },
    removeNode: (node: string) => {
      const ipfsConfig = configManager.getComponentConfig('ipfs')
      ipfsConfig.nodes = ipfsConfig.nodes.filter(n => n !== node)
      configManager.updateComponentConfig('ipfs', ipfsConfig)
    }
  },

  // CLI configuration helpers
  cli: {
    get: () => configManager.getComponentConfig('cli'),
    update: (updates: Partial<SwissKnifeConfig['cli']>) => configManager.updateComponentConfig('cli', updates),
    setVerbose: (verbose: boolean) => {
      configManager.updateComponentConfig('cli', { verbose })
    },
    setOutputFormat: (outputFormat: SwissKnifeConfig['cli']['outputFormat']) => {
      configManager.updateComponentConfig('cli', { outputFormat })
    }
  }
}

export default configManager