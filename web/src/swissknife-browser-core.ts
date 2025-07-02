/**
 * SwissKnife Browser Core Entry Point
 * 
 * This file creates a browser-compatible version of the full SwissKnife TypeScript codebase
 * using webpack compilation instead of reimplementation.
 */

// Import browser adapters first
import './adapters/browser-globals';

// Import core SwissKnife modules directly from TypeScript source
import { BaseModel } from '@swissknife/ai/models/model';
import { AIService } from '@swissknife/ai/service';
import { TaskManager } from '@swissknife/tasks/manager';
import { StorageService } from '@swissknife/storage/service';
import { CommandRegistry } from '@swissknife/commands';
import { ConfigManager } from '@swissknife/config';
import { UtilityManager } from '@swissknife/utils';

// Import browser-specific adapters
import { BrowserStorageAdapter } from './adapters/browser-storage-adapter';
import { BrowserCommandAdapter } from './adapters/browser-command-adapter';
import { BrowserAIAdapter } from './adapters/browser-ai-adapter';

export interface SwissKnifeBrowserOptions {
  config?: {
    storage?: string;
    ai?: {
      provider?: string;
      apiKey?: string;
      autoRegisterModels?: boolean;
      autoRegisterTools?: boolean;
    };
    debug?: boolean;
  };
  storage?: {
    type?: 'localstorage' | 'indexeddb' | 'memory';
    dbName?: string;
  };
  ai?: {
    autoRegisterModels?: boolean;
    autoRegisterTools?: boolean;
  };
  web?: boolean;
}

export interface SwissKnifeServices {
  ai: BrowserAIAdapter;
  tasks: TaskManager;
  storage: BrowserStorageAdapter;
  commands: BrowserCommandAdapter;
  config: ConfigManager;
  utils: UtilityManager;
}

/**
 * Main SwissKnife Browser Core Class
 * Provides full TypeScript functionality in the browser through webpack compilation
 */
export class SwissKnifeBrowserCore {
  private initialized: boolean = false;
  private services: Partial<SwissKnifeServices> = {};
  private options: SwissKnifeBrowserOptions = {};

  constructor(options: SwissKnifeBrowserOptions = {}) {
    this.options = {
      config: {
        storage: 'localstorage',
        debug: false,
        ...options.config
      },
      storage: {
        type: 'indexeddb',
        dbName: 'swissknife-web',
        ...options.storage
      },
      ai: {
        autoRegisterModels: true,
        autoRegisterTools: true,
        ...options.ai
      },
      web: true,
      ...options
    };
  }

  /**
   * Initialize all SwissKnife services with browser adapters
   */
  async initialize(): Promise<{ success: boolean; services?: SwissKnifeServices; error?: string }> {
    try {
      console.log('Initializing SwissKnife Browser Core...');

      // Initialize configuration management
      this.services.config = new ConfigManager({
        storage: this.options.config?.storage || 'localstorage',
        debug: this.options.config?.debug || false
      });

      // Initialize utility manager
      this.services.utils = new UtilityManager();

      // Initialize browser-adapted storage service
      this.services.storage = new BrowserStorageAdapter({
        type: this.options.storage?.type || 'indexeddb',
        dbName: this.options.storage?.dbName || 'swissknife-web'
      });
      await this.services.storage.initialize();

      // Initialize AI service with browser adapter
      this.services.ai = new BrowserAIAdapter({
        provider: this.options.config?.ai?.provider || 'openai',
        apiKey: this.options.config?.ai?.apiKey,
        storage: this.services.storage,
        config: this.services.config
      });

      if (this.options.ai?.autoRegisterModels) {
        await this.services.ai.registerDefaultModels();
      }

      if (this.options.ai?.autoRegisterTools) {
        await this.services.ai.registerDefaultTools();
      }

      // Initialize task manager
      this.services.tasks = new TaskManager({
        storage: this.services.storage,
        ai: this.services.ai,
        config: this.services.config
      });

      // Initialize command registry with browser adapter
      this.services.commands = new BrowserCommandAdapter({
        ai: this.services.ai,
        tasks: this.services.tasks,
        storage: this.services.storage,
        config: this.services.config,
        utils: this.services.utils
      });

      await this.services.commands.registerBrowserCommands();

      this.initialized = true;

      console.log('SwissKnife Browser Core initialized successfully');
      console.log('Available services:', Object.keys(this.services));

      return {
        success: true,
        services: this.services as SwissKnifeServices
      };

    } catch (error) {
      console.error('Failed to initialize SwissKnife Browser Core:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown initialization error'
      };
    }
  }

  /**
   * Get initialized services
   */
  getServices(): SwissKnifeServices | null {
    if (!this.initialized) {
      console.warn('SwissKnife Browser Core not initialized. Call initialize() first.');
      return null;
    }
    return this.services as SwissKnifeServices;
  }

  /**
   * Execute a command through the command registry
   */
  async executeCommand(commandString: string, options?: any): Promise<any> {
    if (!this.initialized || !this.services.commands) {
      throw new Error('SwissKnife Browser Core not initialized');
    }

    return await this.services.commands.execute(commandString, options);
  }

  /**
   * Generate AI response
   */
  async generateAI(prompt: string, options: any = {}): Promise<any> {
    if (!this.initialized || !this.services.ai) {
      throw new Error('SwissKnife Browser Core not initialized');
    }

    return await this.services.ai.generateResponse(prompt, options.modelName);
  }

  /**
   * Generate AI response (alias for compatibility)
   */
  async generateAIResponse(prompt: string, modelName?: string): Promise<any> {
    return this.generateAI(prompt, { modelName });
  }

  /**
   * Get available AI models
   */
  getAvailableModels(): string[] {
    if (!this.initialized || !this.services.ai) {
      return [];
    }
    
    return this.services.ai.getAvailableModels();
  }

  /**
   * Create a new task
   */
  async createTask(taskOptions: any): Promise<any> {
    if (!this.initialized || !this.services.tasks) {
      throw new Error('SwissKnife Browser Core not initialized');
    }

    return await this.services.tasks.createTask(taskOptions);
  }

  /**
   * Store data using the storage service
   */
  async store(key: string, data: any): Promise<void> {
    if (!this.initialized || !this.services.storage) {
      throw new Error('SwissKnife Browser Core not initialized');
    }

    await this.services.storage.store(key, data);
  }

  /**
   * Retrieve data using the storage service
   */
  async retrieve(key: string): Promise<any> {
    if (!this.initialized || !this.services.storage) {
      throw new Error('SwissKnife Browser Core not initialized');
    }

    return await this.services.storage.retrieve(key);
  }

  /**
   * Get configuration value
   */
  getConfig(key: string): any {
    if (!this.initialized || !this.services.config) {
      throw new Error('SwissKnife Browser Core not initialized');
    }

    return this.services.config.get(key);
  }

  /**
   * Set configuration value
   */
  setConfig(key: string, value: any): void {
    if (!this.initialized || !this.services.config) {
      throw new Error('SwissKnife Browser Core not initialized');
    }

    this.services.config.set(key, value);
  }

  /**
   * Check if the core is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get version information
   */
  getVersion(): string {
    return '0.0.53-browser';
  }

  /**
   * Dispose of resources
   */
  async dispose(): Promise<void> {
    if (this.services.storage) {
      await this.services.storage.dispose?.();
    }
    
    if (this.services.ai) {
      await this.services.ai.dispose?.();
    }
    
    if (this.services.commands) {
      await this.services.commands.dispose?.();
    }
    
    this.services = {};
    this.initialized = false;
  }
}

// Create and export a singleton instance
export const swissknifeBrowser = new SwissKnifeBrowserCore();

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).SwissKnife = {
    Core: SwissKnifeBrowserCore,
    instance: swissknifeBrowser,
    // Backward compatibility
    initialize: (options: SwissKnifeBrowserOptions) => swissknifeBrowser.initialize(),
    getServices: () => swissknifeBrowser.getServices(),
    executeCommand: (cmd: string) => swissknifeBrowser.executeCommand(cmd),
    generateAI: (prompt: string, options?: any) => swissknifeBrowser.generateAI(prompt, options),
    createTask: (options: any) => swissknifeBrowser.createTask(options),
    store: (key: string, data: any) => swissknifeBrowser.store(key, data),
    retrieve: (key: string) => swissknifeBrowser.retrieve(key),
    getConfig: (key: string) => swissknifeBrowser.getConfig(key),
    setConfig: (key: string, value: any) => swissknifeBrowser.setConfig(key, value)
  };
}

export default swissknifeBrowser;
