// Enhanced CLI integration with shared system for unified command execution
import { eventBus } from '../events/index.js'
import { configManager } from '../config/index.js'
import { aiManager } from '../ai/index.js'
import { SwissKnifeEvents } from '../types/index.js'
import { generateRandomId } from '../utils/index.js'

// Re-export the new unified system
export * from './unified-adapter.js'
export { unifiedCLIAdapter } from './unified-adapter.js'

// Keep backward compatibility
export interface CLICommand {
  name: string
  description: string
  usage: string
  category: 'ai' | 'config' | 'events' | 'desktop' | 'ipfs' | 'system'
  handler: (args: string[], flags: Record<string, any>) => Promise<CLIResult>
}

export interface CLIResult {
  success: boolean
  output: string
  exitCode: number
  data?: any
}

// Legacy adapter for backward compatibility
export class SharedCLIAdapter {
  private commands: Map<string, CLICommand> = new Map()
  private commandHistory: string[] = []
  
  constructor() {
    console.warn('SharedCLIAdapter is deprecated. Use UnifiedCLIAdapter instead.')
    this.initializeSharedCommands()
    this.setupEventListeners()
  }

  private initializeSharedCommands(): void {
    // AI Commands with shared system integration
    this.registerCommand({
      name: 'sk-ai',
      description: 'AI model management and inference',
      usage: 'sk-ai <action> [options]',
      category: 'ai',
      handler: this.handleAI.bind(this)
    })

    // Configuration commands with shared system
    this.registerCommand({
      name: 'sk-config', 
      description: 'Unified configuration management',
      usage: 'sk-config <action> [key] [value]',
      category: 'config',
      handler: this.handleConfig.bind(this)
    })

    // Event system commands
    this.registerCommand({
      name: 'sk-events',
      description: 'Cross-component event management',
      usage: 'sk-events <action> [event] [data]',
      category: 'events', 
      handler: this.handleEvents.bind(this)
    })

    // Desktop integration commands
    this.registerCommand({
      name: 'sk-desktop',
      description: 'Virtual desktop app control',
      usage: 'sk-desktop <action> [app-id] [options]',
      category: 'desktop',
      handler: this.handleDesktop.bind(this)
    })

    // IPFS integration commands
    this.registerCommand({
      name: 'sk-ipfs',
      description: 'IPFS operations with acceleration',
      usage: 'sk-ipfs <action> [options]',
      category: 'ipfs',
      handler: this.handleIPFS.bind(this)
    })

    // System status and integration
    this.registerCommand({
      name: 'sk-status',
      description: 'Unified system status',
      usage: 'sk-status [component]',
      category: 'system',
      handler: this.handleStatus.bind(this)
    })
  }

  private setupEventListeners(): void {
    // Listen for CLI command events from other components
    eventBus.on('cli:command', async (data) => {
      const result = await this.executeCommand(`${data.command} ${data.args.join(' ')}`)
      eventBus.emit('cli:response', {
        output: result.output,
        exitCode: result.exitCode,
        command: data.command
      })
    })
  }

  registerCommand(command: CLICommand): void {
    this.commands.set(command.name, command)
  }

  async executeCommand(input: string): Promise<CLIResult> {
    const trimmed = input.trim()
    if (!trimmed) {
      return { success: true, output: '', exitCode: 0 }
    }

    this.commandHistory.push(trimmed)
    
    const parsed = this.parseCommand(trimmed)
    const command = this.commands.get(parsed.command)

    if (!command) {
      return {
        success: false,
        output: `Command not found: ${parsed.command}\nAvailable commands: ${Array.from(this.commands.keys()).join(', ')}`,
        exitCode: 127
      }
    }

    try {
      const result = await command.handler(parsed.args, parsed.flags)
      
      // Emit command executed event
      eventBus.emit('cli:response', {
        output: result.output,
        exitCode: result.exitCode,
        command: parsed.command
      })
      
      return result
    } catch (error) {
      return {
        success: false,
        output: `Error: ${(error as Error).message}`,
        exitCode: 1
      }
    }
  }

  private parseCommand(input: string): { command: string; args: string[]; flags: Record<string, any> } {
    const parts = input.split(/\s+/)
    const command = parts[0]
    const args: string[] = []
    const flags: Record<string, any> = {}

    for (let i = 1; i < parts.length; i++) {
      const part = parts[i]
      if (part.startsWith('--')) {
        const [key, value] = part.substring(2).split('=')
        flags[key] = value || true
      } else if (part.startsWith('-')) {
        const flagChars = part.substring(1)
        for (const char of flagChars) {
          flags[char] = true
        }
      } else {
        args.push(part)
      }
    }

    return { command, args, flags }
  }

  // Enhanced command handlers with shared system integration

  private async handleAI(args: string[], flags: Record<string, any>): Promise<CLIResult> {
    const action = args[0]
    
    switch (action) {
      case 'inference': {
        const prompt = args.slice(1).join(' ')
        if (!prompt) {
          return {
            success: false,
            output: 'Usage: sk-ai inference <prompt>',
            exitCode: 1
          }
        }

        try {
          const response = await aiManager.inference({
            model: flags.model || 'gpt-3.5-turbo',
            prompt,
            temperature: flags.temperature || 0.7
          })
          
          return {
            success: true,
            output: `AI Response: ${response.response}`,
            exitCode: 0,
            data: response
          }
        } catch (error) {
          return {
            success: false,
            output: `AI Inference Error: ${(error as Error).message}`,
            exitCode: 1
          }
        }
      }

      case 'models': {
        try {
          const models = await aiManager.getAllModels()
          const output = models.map(m => 
            `${m.id} (${m.provider}) - ${m.available ? '✅' : '❌'} ${m.local ? 'Local' : 'Remote'}`
          ).join('\n')
          
          return {
            success: true,
            output: `Available AI Models:\n${output}`,
            exitCode: 0,
            data: models
          }
        } catch (error) {
          return {
            success: false,
            output: `Error getting models: ${(error as Error).message}`,
            exitCode: 1
          }
        }
      }

      case 'providers': {
        const providers = aiManager.getProviders()
        const output = providers.map(p => `${p.getName()} - Available`).join('\n')
        
        return {
          success: true,
          output: `AI Providers:\n${output}`,
          exitCode: 0
        }
      }

      default:
        return {
          success: false,
          output: `Unknown AI action: ${action}\nAvailable: inference, models, providers`,
          exitCode: 1
        }
    }
  }

  private async handleConfig(args: string[], flags: Record<string, any>): Promise<CLIResult> {
    const action = args[0]
    
    switch (action) {
      case 'get': {
        const key = args[1]
        if (!key) {
          const config = configManager.getConfig()
          return {
            success: true,
            output: JSON.stringify(config, null, 2),
            exitCode: 0,
            data: config
          }
        }

        const [component, subKey] = key.split('.')
        if (component && ['ai', 'web', 'cli', 'ipfs'].includes(component)) {
          const componentConfig = configManager.getComponentConfig(component as any)
          const value = subKey ? (componentConfig as any)[subKey] : componentConfig
          
          return {
            success: true,
            output: JSON.stringify(value, null, 2),
            exitCode: 0,
            data: value
          }
        }

        return {
          success: false,
          output: `Invalid config key: ${key}`,
          exitCode: 1
        }
      }

      case 'set': {
        const key = args[1]
        const value = args[2]
        
        if (!key || !value) {
          return {
            success: false,
            output: 'Usage: sk-config set <key> <value>',
            exitCode: 1
          }
        }

        const [component, subKey] = key.split('.')
        if (component && ['ai', 'web', 'cli', 'ipfs'].includes(component) && subKey) {
          try {
            const updates = { [subKey]: JSON.parse(value) }
            configManager.updateComponentConfig(component as any, updates)
            
            return {
              success: true,
              output: `Updated ${key} = ${value}`,
              exitCode: 0
            }
          } catch (error) {
            return {
              success: false,
              output: `Error updating config: ${(error as Error).message}`,
              exitCode: 1
            }
          }
        }

        return {
          success: false,
          output: `Invalid config key: ${key}`,
          exitCode: 1
        }
      }

      case 'reset': {
        configManager.resetConfig()
        return {
          success: true,
          output: 'Configuration reset to defaults',
          exitCode: 0
        }
      }

      default:
        return {
          success: false,
          output: `Unknown config action: ${action}\nAvailable: get, set, reset`,
          exitCode: 1
        }
    }
  }

  private async handleEvents(args: string[], flags: Record<string, any>): Promise<CLIResult> {
    const action = args[0]
    
    switch (action) {
      case 'emit': {
        const eventName = args[1] as keyof SwissKnifeEvents
        const eventData = args.slice(2).join(' ')
        
        if (!eventName) {
          return {
            success: false,
            output: 'Usage: sk-events emit <event-name> [data]',
            exitCode: 1
          }
        }

        try {
          const data = eventData ? JSON.parse(eventData) : {}
          await eventBus.emit(eventName, data)
          
          return {
            success: true,
            output: `Emitted event: ${eventName}`,
            exitCode: 0
          }
        } catch (error) {
          return {
            success: false,
            output: `Error emitting event: ${(error as Error).message}`,
            exitCode: 1
          }
        }
      }

      case 'list': {
        const activeEvents = eventBus.getActiveEvents()
        return {
          success: true,
          output: `Active events:\n${activeEvents.join('\n')}`,
          exitCode: 0,
          data: activeEvents
        }
      }

      default:
        return {
          success: false,
          output: `Unknown events action: ${action}\nAvailable: emit, list`,
          exitCode: 1
        }
    }
  }

  private async handleDesktop(args: string[], flags: Record<string, any>): Promise<CLIResult> {
    const action = args[0]
    
    switch (action) {
      case 'launch': {
        const appId = args[1]
        if (!appId) {
          return {
            success: false,
            output: 'Usage: sk-desktop launch <app-id>',
            exitCode: 1
          }
        }

        // Emit desktop app launch event
        eventBus.emit('web:app-launch', { appId, params: flags })
        
        return {
          success: true,
          output: `Launched desktop app: ${appId}`,
          exitCode: 0
        }
      }

      case 'close': {
        const appId = args[1]
        if (!appId) {
          return {
            success: false,
            output: 'Usage: sk-desktop close <app-id>',
            exitCode: 1
          }
        }

        // Emit desktop app close event
        eventBus.emit('web:app-close', { appId })
        
        return {
          success: true,
          output: `Closed desktop app: ${appId}`,
          exitCode: 0
        }
      }

      case 'list': {
        return {
          success: true,
          output: `Available desktop apps:
- terminal (SwissKnife Terminal)
- ai-chat (AI Chat)
- file-manager (File Manager)
- device-manager (Device Manager)
- ipfs-explorer (IPFS Explorer)
- settings (Settings)`,
          exitCode: 0
        }
      }

      default:
        return {
          success: false,
          output: `Unknown desktop action: ${action}\nAvailable: launch, close, list`,
          exitCode: 1
        }
    }
  }

  private async handleIPFS(args: string[], flags: Record<string, any>): Promise<CLIResult> {
    const action = args[0]
    
    switch (action) {
      case 'status': {
        return {
          success: true,
          output: `IPFS Status:
Gateway: ${configManager.getComponentConfig('ipfs').gateway}
Acceleration: ${configManager.getComponentConfig('ipfs').accelerate ? 'Enabled' : 'Disabled'}
Nodes: ${configManager.getComponentConfig('ipfs').nodes.join(', ')}`,
          exitCode: 0
        }
      }

      case 'add': {
        const filePath = args[1]
        if (!filePath) {
          return {
            success: false,
            output: 'Usage: sk-ipfs add <file-path>',
            exitCode: 1
          }
        }

        // Mock IPFS add operation
        const hash = `Qm${generateRandomId(44)}`
        
        return {
          success: true,
          output: `Added to IPFS: ${hash}`,
          exitCode: 0,
          data: { hash, file: filePath }
        }
      }

      default:
        return {
          success: false,
          output: `Unknown IPFS action: ${action}\nAvailable: status, add`,
          exitCode: 1
        }
    }
  }

  private async handleStatus(args: string[], flags: Record<string, any>): Promise<CLIResult> {
    const component = args[0]
    
    if (component && ['ai', 'web', 'cli', 'ipfs'].includes(component)) {
      const config = configManager.getComponentConfig(component as any)
      return {
        success: true,
        output: `${component.toUpperCase()} Status:\n${JSON.stringify(config, null, 2)}`,
        exitCode: 0,
        data: config
      }
    }

    // Overall system status
    const allConfig = configManager.getConfig()
    const aiProviders = aiManager.getProviders()
    const activeEvents = eventBus.getActiveEvents()
    
    return {
      success: true,
      output: `SwissKnife Unified System Status:
AI Providers: ${aiProviders.length} registered
Configuration: ${Object.keys(allConfig).join(', ')} components
Active Events: ${activeEvents.length} listeners
Shared System: ✅ Online`,
      exitCode: 0,
      data: {
        config: allConfig,
        aiProviders: aiProviders.length,
        activeEvents: activeEvents.length
      }
    }
  }

  getCommands(): CLICommand[] {
    return Array.from(this.commands.values())
  }

  getCommandHistory(): string[] {
    return [...this.commandHistory]
  }
}

// Global shared CLI adapter instance
export const sharedCLI = new SharedCLIAdapter()

export default sharedCLI