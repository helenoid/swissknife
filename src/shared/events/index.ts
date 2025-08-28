// Event system for cross-component communication
import { SwissKnifeEvents } from '../types/index.js'

type EventHandler<T = any> = (data: T) => void | Promise<void>

class SwissKnifeEventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map()
  private debugging = false

  // Enable/disable event debugging
  setDebugMode(enabled: boolean): void {
    this.debugging = enabled
  }

  // Subscribe to an event
  on<K extends keyof SwissKnifeEvents>(
    event: K, 
    handler: EventHandler<SwissKnifeEvents[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(handler)
    
    if (this.debugging) {
      console.log(`[EventBus] Subscribed to ${event}`)
    }

    // Return unsubscribe function
    return () => {
      this.off(event, handler)
    }
  }

  // Unsubscribe from an event
  off<K extends keyof SwissKnifeEvents>(
    event: K, 
    handler: EventHandler<SwissKnifeEvents[K]>
  ): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(handler)
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
    }
    
    if (this.debugging) {
      console.log(`[EventBus] Unsubscribed from ${event}`)
    }
  }

  // Subscribe to event once
  once<K extends keyof SwissKnifeEvents>(
    event: K, 
    handler: EventHandler<SwissKnifeEvents[K]>
  ): void {
    const onceHandler = (data: SwissKnifeEvents[K]) => {
      handler(data)
      this.off(event, onceHandler)
    }
    this.on(event, onceHandler)
  }

  // Emit an event
  async emit<K extends keyof SwissKnifeEvents>(
    event: K, 
    data: SwissKnifeEvents[K]
  ): Promise<void> {
    const eventListeners = this.listeners.get(event)
    
    if (this.debugging) {
      console.log(`[EventBus] Emitting ${event}:`, data)
    }
    
    if (eventListeners) {
      const promises: Promise<void>[] = []
      
      for (const handler of eventListeners) {
        try {
          const result = handler(data)
          if (result instanceof Promise) {
            promises.push(result)
          }
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${event}:`, error)
        }
      }
      
      // Wait for all async handlers to complete
      if (promises.length > 0) {
        await Promise.allSettled(promises)
      }
    }
  }

  // Get event listener count
  getListenerCount<K extends keyof SwissKnifeEvents>(event: K): number {
    return this.listeners.get(event)?.size || 0
  }

  // Get all active events
  getActiveEvents(): string[] {
    return Array.from(this.listeners.keys())
  }

  // Clear all listeners
  clear(): void {
    this.listeners.clear()
    if (this.debugging) {
      console.log('[EventBus] Cleared all listeners')
    }
  }

  // Create a scoped event namespace
  createNamespace(namespace: string) {
    const namespacedBus = {
      on: <K extends keyof SwissKnifeEvents>(
        event: K, 
        handler: EventHandler<SwissKnifeEvents[K]>
      ) => this.on(`${namespace}:${event}` as K, handler),
      
      off: <K extends keyof SwissKnifeEvents>(
        event: K, 
        handler: EventHandler<SwissKnifeEvents[K]>
      ) => this.off(`${namespace}:${event}` as K, handler),
      
      emit: <K extends keyof SwissKnifeEvents>(
        event: K, 
        data: SwissKnifeEvents[K]
      ) => this.emit(`${namespace}:${event}` as K, data),
      
      once: <K extends keyof SwissKnifeEvents>(
        event: K, 
        handler: EventHandler<SwissKnifeEvents[K]>
      ) => this.once(`${namespace}:${event}` as K, handler)
    }
    
    return namespacedBus
  }
}

// Global event bus instance
export const eventBus = new SwissKnifeEventBus()

// Convenience function to create component-specific event buses
export function createComponentEventBus(component: 'cli' | 'web' | 'ipfs') {
  return eventBus.createNamespace(component)
}

// Helper functions for common event patterns
export const events = {
  // CLI events
  cli: {
    executeCommand: (command: string, args: string[] = [], cwd?: string) =>
      eventBus.emit('cli:command', { command, args, cwd }),
    
    onCommandResponse: (handler: (response: { output: string, exitCode: number, command: string }) => void) =>
      eventBus.on('cli:response', handler)
  },

  // Web app events  
  web: {
    launchApp: (appId: string, params?: any) =>
      eventBus.emit('web:app-launch', { appId, params }),
    
    closeApp: (appId: string) =>
      eventBus.emit('web:app-close', { appId }),
    
    onAppLaunch: (handler: (data: { appId: string, params?: any }) => void) =>
      eventBus.on('web:app-launch', handler)
  },

  // IPFS events
  ipfs: {
    uploadFile: (file: File, callback: (hash: string) => void) =>
      eventBus.emit('ipfs:upload', { file, callback }),
    
    downloadFile: (hash: string, callback: (data: Uint8Array) => void) =>
      eventBus.emit('ipfs:download', { hash, callback }),
    
    onUpload: (handler: (data: { file: File, callback: (hash: string) => void }) => void) =>
      eventBus.on('ipfs:upload', handler)
  },

  // AI events
  ai: {
    requestInference: (model: string, prompt: string, callback: (response: string) => void) =>
      eventBus.emit('ai:inference', { model, prompt, callback }),
    
    onInferenceRequest: (handler: (data: { model: string, prompt: string, callback: (response: string) => void }) => void) =>
      eventBus.on('ai:inference', handler)
  },

  // System events
  system: {
    updateStatus: (component: string, status: 'online' | 'offline' | 'error') =>
      eventBus.emit('system:status', { component, status }),
    
    onStatusUpdate: (handler: (data: { component: string, status: string }) => void) =>
      eventBus.on('system:status', handler)
  }
}

export default eventBus