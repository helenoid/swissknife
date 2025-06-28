/**
 * SwissKnife Browser Entry Point
 * 
 * This file adapts the existing SwissKnife TypeScript core for browser use.
 * It creates browser-compatible wrappers around the Node.js-based components.
 */

// Browser polyfills for Node.js modules
import { Buffer } from 'buffer';
import process from 'process';

// Make globals available
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  window.process = process;
  window.global = window;
}

/**
 * Browser-adapted SwissKnife Core Engine
 * This version provides a compatible API without requiring the full Node.js SwissKnife core
 */
export class SwissKnifeBrowser {
  constructor() {
    this.initialized = false;
    this.config = new Map();
    this.models = [];
    this.tasks = new Map();
    
    // Default configuration
    this.config.set('storage', 'localstorage');
    this.config.set('ai.provider', 'openai');
    this.config.set('debug', false);
  }

  /**
   * Initialize SwissKnife for browser environment
   */
  async initialize(options = {}) {
    try {
      console.log('Initializing SwissKnife for browser...');
      
      // Merge options with config
      if (options.config) {
        Object.entries(options.config).forEach(([key, value]) => {
          this.config.set(key, value);
        });
      }
      
      // Set up API keys
      if (options.openaiApiKey) {
        this.config.set('openai.apiKey', options.openaiApiKey);
        localStorage.setItem('swissknife_openai_key', options.openaiApiKey);
      }
      
      // Initialize storage
      await this.initializeStorage(options.storage || {});
      
      // Initialize AI models
      await this.initializeModels();
      
      this.initialized = true;
      console.log('SwissKnife browser initialization complete');
      
      return {
        success: true,
        message: 'SwissKnife initialized successfully for browser'
      };
    } catch (error) {
      console.error('Failed to initialize SwissKnife for browser:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async initializeStorage(options = {}) {
    // Use IndexedDB for browser storage
    this.storage = {
      type: options.type || 'indexeddb',
      dbName: options.dbName || 'swissknife-web'
    };
    console.log('Storage initialized:', this.storage.type);
  }

  async initializeModels() {
    // Add default models
    this.models = [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        description: 'OpenAI GPT-4 model'
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        description: 'OpenAI GPT-3.5 Turbo model'
      }
    ];
    console.log('Models initialized:', this.models.length);
  }

  /**
   * Execute an AI task in the browser
   */
  async executeTask(taskDescription, options = {}) {
    if (!this.initialized) {
      throw new Error('SwissKnife not initialized. Call initialize() first.');
    }

    try {
      const taskId = this.generateId();
      const task = {
        id: taskId,
        description: taskDescription,
        status: 'pending',
        created: new Date().toISOString(),
        priority: options.priority || 0
      };
      
      this.tasks.set(taskId, task);
      
      // Simulate AI processing
      console.log('Processing task:', taskDescription);
      
      // If we have an API key, we could make actual AI calls here
      const apiKey = this.config.get('openai.apiKey');
      if (apiKey && options.useAI !== false) {
        try {
          const response = await this.callOpenAI(taskDescription, apiKey);
          task.result = response;
          task.status = 'completed';
        } catch (error) {
          task.status = 'failed';
          task.error = error.message;
        }
      } else {
        // Fallback response
        task.result = {
          content: `Task processed: ${taskDescription}`,
          type: 'simulated'
        };
        task.status = 'completed';
      }

      return {
        success: true,
        task,
        result: task.result
      };
    } catch (error) {
      console.error('Error executing task:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Chat with AI agent
   */
  async chat(message, options = {}) {
    if (!this.initialized) {
      throw new Error('SwissKnife not initialized. Call initialize() first.');
    }

    try {
      const apiKey = this.config.get('openai.apiKey');
      
      if (apiKey) {
        const response = await this.callOpenAI(message, apiKey);
        return {
          success: true,
          response: response.content || response,
          conversationId: options.conversationId || this.generateId()
        };
      } else {
        // Simulated response when no API key
        return {
          success: true,
          response: `I'm a simulated AI response to: "${message}". To enable real AI responses, please set your OpenAI API key in settings.`,
          conversationId: options.conversationId || this.generateId()
        };
      }
    } catch (error) {
      console.error('Error in chat:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async callOpenAI(message, apiKey) {
    // Simple OpenAI API call for browser
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: message
        }],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0]?.message?.content || 'No response',
      usage: data.usage
    };
  }

  /**
   * List available AI models
   */
  getAvailableModels() {
    return this.models;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    const config = {};
    this.config.forEach((value, key) => {
      config[key] = value;
    });
    return config;
  }

  /**
   * Update configuration
   */
  async updateConfig(updates) {
    for (const [key, value] of Object.entries(updates)) {
      this.config.set(key, value);
      
      // Persist certain config to localStorage
      if (key.includes('apiKey')) {
        localStorage.setItem(`swissknife_${key.replace('.', '_')}`, value);
      }
    }
    
    return this.getConfig();
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId) {
    return this.tasks.get(taskId) || null;
  }

  /**
   * List all tasks
   */
  async listTasks() {
    return Array.from(this.tasks.values());
  }

  /**
   * Store content using content-addressed storage
   */
  async storeContent(content, options = {}) {
    try {
      const hash = await this.generateHash(content);
      const key = `content_${hash}`;
      
      localStorage.setItem(key, JSON.stringify({
        content,
        timestamp: new Date().toISOString(),
        size: content.length,
        ...options
      }));
      
      return {
        success: true,
        hash,
        size: content.length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retrieve content by hash
   */
  async retrieveContent(hash) {
    try {
      const key = `content_${hash}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        throw new Error('Content not found');
      }
      
      const data = JSON.parse(stored);
      return {
        success: true,
        content: data.content
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate a simple hash for content addressing
   */
  async generateHash(content) {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }

  /**
   * Generate a unique ID
   */
  generateId() {
    return 'sk_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get hardware status for system monitoring
   */
  getHardwareStatus() {
    return {
      webnn: 'ml' in navigator || 'webkitML' in navigator || false,
      gpu: 'gpu' in navigator || false,
      webgl: (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
          return false;
        }
      })(),
      storage: 'storage' in navigator && 'estimate' in navigator.storage,
      workers: 'Worker' in window && 'SharedWorker' in window,
      wasm: 'WebAssembly' in window
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    try {
      this.initialized = false;
      console.log('SwissKnife browser instance shut down');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}

// Create and export a singleton instance
const swissknife = new SwissKnifeBrowser();

// Export the singleton as default
export default swissknife;

// Global access for console debugging
if (typeof window !== 'undefined') {
  window.SwissKnife = swissknife;
}
