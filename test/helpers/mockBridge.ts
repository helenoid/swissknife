// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Mock bridge implementations for integration testing
 */

import { EventEmitter } from 'events';

/**
 * Creates a mock bridge implementation for testing
 */
export function createMockBridge(id = 'mock-bridge', options: {
  source?: 'current' | 'goose' | 'ipfs_accelerate' | 'swissknife_old';
  target?: 'current' | 'goose' | 'ipfs_accelerate' | 'swissknife_old';
  methods?: Record<string, (...args: any[]) => any>;
  autoInitialize?: boolean;
} = {}) {
  const {
    source = 'current',
    target = 'goose',
    methods = {},
    autoInitialize = true
  } = options;
  
  const events = new EventEmitter();
  let initialized = false;
  const callHistory: { method: string; args: any }[] = [];
  
  return {
    id,
    name: `Mock Bridge (${id})`,
    source,
    target,
    events,
    callHistory,
    
    async initialize(): Promise<boolean> {
      initialized = true;
      events.emit('initialized', { bridgeId: id });
      return true;
    },
    
    isInitialized(): boolean {
      return initialized;
    },
    
    async call<T>(method: string, args: any): Promise<T> {
      if (!initialized && !autoInitialize) {
        throw new Error(`Bridge ${id} not initialized`);
      }
      
      callHistory.push({ method, args });
      events.emit('call', { bridgeId: id, method, args });
      
      if (methods[method]) {
        return methods[method](args);
      }
      
      // Default mock response
      return {
        success: true,
        data: {
          message: `Mock response from ${id} for method ${method}`,
          args
        }
      } as unknown as T;
    }
  };
}

/**
 * Creates a mock IPFS MCP bridge for testing
 */
export function createMockIPFSBridge() {
  const storage = new Map<string, Buffer>();
  
  return createMockBridge('ipfs-mcp', {
    source: 'current',
    target: 'ipfs_accelerate',
    methods: {
      addContent: async (args: { content: string | Buffer }) => {
        const content = typeof args.content === 'string' 
          ? Buffer.from(args.content) 
          : args.content;
        
        const cid = `mock-cid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        storage.set(cid, content);
        
        return { cid };
      },
      
      getContent: async (args: { cid: string }) => {
        const content = storage.get(args.cid);
        if (!content) {
          throw new Error(`Content not found for CID: ${args.cid}`);
        }
        return content;
      },
      
      listContent: async () => {
        return Array.from(storage.keys());
      },
      
      deleteContent: async (args: { cid: string }) => {
        const exists = storage.has(args.cid);
        storage.delete(args.cid);
        return { success: exists };
      }
    }
  });
}

/**
 * Creates a mock Goose bridge for testing
 */
export function createMockGooseBridge() {
  return createMockBridge('goose-mcp', {
    source: 'current',
    target: 'goose',
    methods: {
      generate_completion: async (args: { 
        model: string;
        prompt: string;
        api_key?: string;
        options?: any;
      }) => {
        return {
          completion: `Mock completion for prompt: ${args.prompt.substring(0, 20)}...`,
          usage: {
            promptTokens: args.prompt.length / 4, // Rough approximation
            completionTokens: 100,
            totalTokens: args.prompt.length / 4 + 100
          },
          timing_ms: 500
        };
      },
      
      process_message: async (args: {
        message: string;
        history?: any[];
      }) => {
        return {
          response: `Mock response to message: ${args.message.substring(0, 20)}...`,
          thinking: `Mock thinking about: ${args.message}`,
          usage: {
            promptTokens: 50,
            completionTokens: 100,
            totalTokens: 150
          }
        };
      }
    }
  });
}

/**
 * Creates a mock TaskNet bridge for testing
 */
export function createMockTaskNetBridge() {
  const tasks = new Map<string, any>();
  
  return createMockBridge('tasknet', {
    source: 'current',
    target: 'swissknife_old',
    methods: {
      createTask: async (args: {
        description: string;
        priority?: number;
        data?: any;
      }) => {
        const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        tasks.set(taskId, {
          id: taskId,
          description: args.description,
          priority: args.priority || 5,
          status: 'pending',
          data: args.data,
          createdAt: Date.now()
        });
        
        return { taskId };
      },
      
      executeTask: async (args: { taskId: string }) => {
        const task = tasks.get(args.taskId);
        if (!task) {
          throw new Error(`Task not found: ${args.taskId}`);
        }
        
        task.status = 'completed';
        task.completedAt = Date.now();
        task.result = {
          success: true,
          message: `Task ${args.taskId} executed successfully`,
          data: task.data
        };
        
        return task.result;
      },
      
      getTaskStatus: async (args: { taskId: string }) => {
        const task = tasks.get(args.taskId);
        if (!task) {
          throw new Error(`Task not found: ${args.taskId}`);
        }
        
        return {
          taskId: task.id,
          status: task.status,
          result: task.result
        };
      },
      
      executeModelTask: async (args: {
        model: string;
        prompt: string;
        api_key?: string;
        options?: any;
      }) => {
        return {
          completion: `TaskNet model response to: ${args.prompt.substring(0, 20)}...`,
          usage: {
            promptTokens: args.prompt.length / 4,
            completionTokens: 120,
            totalTokens: args.prompt.length / 4 + 120
          },
          timing_ms: 800
        };
      }
    }
  });
}