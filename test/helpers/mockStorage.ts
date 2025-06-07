// Mock common dependencies
jest.mock("chalk", () => ({ default: (str) => str, red: (str) => str, green: (str) => str, blue: (str) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));
/**
 * Mock storage provider implementation for testing
 */
import { StorageProvider, StorageItemMetadata, ListOptions, AddOptions } from '../../src/types/storage.js';
import { CID, JSONValue } from '../../src/types/common.js';

/**
 * Interface representing a content-addressable storage provider
 */
export interface MockStorageProvider extends StorageProvider {
  // Additional methods for test convenience
  storeTask(task: any): Promise<void>;
  getTask(taskId: string): Promise<any | null>;
  updateTask(task: any): Promise<void>;
  listTasks(filter?: any): Promise<any[]>;
  clear(): Promise<void>;
  stats(): { size: number; items: number };
}

/**
 * Creates a mock in-memory storage provider for testing
 */
export function createMockStorage(): MockStorageProvider {
  const storage = new Map<string, Buffer>();
  const metadata = new Map<string, StorageItemMetadata>();
  const tasks = new Map<string, any>();
  
  return {
    async add(content: string | Buffer, options?: AddOptions): Promise<string> {
      const data = typeof content === 'string' ? Buffer.from(content) : content;
      const cid = `mock-cid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      storage.set(cid, data);
      
      // Store metadata
      metadata.set(cid, {
        contentType: options?.contentType || 'application/octet-stream',
        size: data.length,
        createdAt: Date.now(),
        tags: options?.tags || []
      });
      
      return cid;
    },
    
    async get(cid: string): Promise<Buffer> {
      const content = storage.get(cid);
      if (!content) {
        throw new Error(`Content not found for CID: ${cid}`);
      }
      return content;
    },
    
    async list(options: ListOptions = {}): Promise<{ cids: string[], metadata?: StorageItemMetadata[] }> {
      const { prefix = '', limit } = options;
      
      let results = Array.from(storage.keys())
        .filter(cid => cid.startsWith(prefix));
      
      if (limit !== undefined && limit > 0) {
        results = results.slice(0, limit);
      }
      
      return results;
    },
    
    async delete(cid: string): Promise<boolean> {
      if (!storage.has(cid)) {
        return false;
      }
      return storage.delete(cid);
    },
    
    async exists(cid: string): Promise<boolean> {
      return storage.has(cid);
    },
    
    async storeTask(task: any): Promise<void> {
      if (!task.id) {
        throw new Error('Task must have an id');
      }
      tasks.set(task.id, { ...task });
    },
    
    async getTask(taskId: string): Promise<any | null> {
      return tasks.get(taskId) || null;
    },
    
    async updateTask(task: any): Promise<void> {
      if (!task.id) {
        throw new Error('Task must have an id');
      }
      
      const existing = tasks.get(task.id);
      if (!existing) {
        throw new Error(`Task not found: ${task.id}`);
      }
      
      tasks.set(task.id, { ...existing, ...task });
    },
    
    async listTasks(filter: any = {}): Promise<any[]> {
      let results = Array.from(tasks.values());
      
      // Apply filters if provided
      if (filter) {
        if (filter.status) {
          results = results.filter(task => task.status === filter.status);
        }
        
        if (filter.type) {
          results = results.filter(task => task.type === filter.type);
        }
        
        if (filter.priority) {
          results = results.filter(task => task.priority === filter.priority);
        }
      }
      
      return results;
    },
    
    async clear(): Promise<void> {
      storage.clear();
      tasks.clear();
    },
    
    stats(): { size: number; items: number } {
      let totalSize = 0;
      
      for (const data of storage.values()) {
        totalSize += data.length;
      }
      
      return {
        size: totalSize,
        items: storage.size
      };
    }
  };
}

/**
 * Creates a mock file system storage provider for testing
 */
export function createMockFileSystemStorage(baseDir: string): MockStorageProvider {
  const fs = require('fs/promises');
  const path = require('path');
  
  // Create base directories
  const contentDir = path.join(baseDir, 'content');
  const tasksDir = path.join(baseDir, 'tasks');
  
  // Ensure directories exist
  (async () => {
    await fs.mkdir(contentDir, { recursive: true });
    await fs.mkdir(tasksDir, { recursive: true });
  })();
  
  return {
    async add(content: string | Buffer): Promise<string> {
      const data = typeof content === 'string' ? Buffer.from(content) : content;
      const cid = `mock-cid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      await fs.mkdir(contentDir, { recursive: true });
      await fs.writeFile(path.join(contentDir, cid), data);
      
      return cid;
    },
    
    async get(cid: string): Promise<Buffer> {
      try {
        return await fs.readFile(path.join(contentDir, cid));
      } catch (error) {
        throw new Error(`Content not found for CID: ${cid}`);
      }
    },
    
    async list(options: { prefix?: string; limit?: number; recursive?: boolean } = {}): Promise<string[]> {
      const { prefix = '', limit } = options;
      
      await fs.mkdir(contentDir, { recursive: true });
      const files = await fs.readdir(contentDir);
      
      let results = files.filter(cid => cid.startsWith(prefix));
      
      if (limit !== undefined && limit > 0) {
        results = results.slice(0, limit);
      }
      
      return results;
    },
    
    async delete(cid: string): Promise<boolean> {
      try {
        await fs.unlink(path.join(contentDir, cid));
        return true;
      } catch (error) {
        return false;
      }
    },
    
    async exists(cid: string): Promise<boolean> {
      try {
        await fs.access(path.join(contentDir, cid));
        return true;
      } catch (error) {
        return false;
      }
    },
    
    async storeTask(task: any): Promise<void> {
      if (!task.id) {
        throw new Error('Task must have an id');
      }
      
      await fs.mkdir(tasksDir, { recursive: true });
      await fs.writeFile(
        path.join(tasksDir, `${task.id}.json`),
        JSON.stringify(task, null, 2)
      );
    },
    
    async getTask(taskId: string): Promise<any | null> {
      try {
        const data = await fs.readFile(
          path.join(tasksDir, `${taskId}.json`),
          'utf-8'
        );
        return JSON.parse(data);
      } catch (error) {
        return null;
      }
    },
    
    async updateTask(task: any): Promise<void> {
      if (!task.id) {
        throw new Error('Task must have an id');
      }
      
      const taskPath = path.join(tasksDir, `${task.id}.json`);
      
      try {
        await fs.access(taskPath);
      } catch (error) {
        throw new Error(`Task not found: ${task.id}`);
      }
      
      // Read existing task
      const existingData = await fs.readFile(taskPath, 'utf-8');
      const existingTask = JSON.parse(existingData);
      
      // Update task
      const updatedTask = { ...existingTask, ...task };
      
      // Write updated task
      await fs.writeFile(
        taskPath,
        JSON.stringify(updatedTask, null, 2)
      );
    },
    
    async listTasks(filter: any = {}): Promise<any[]> {
      await fs.mkdir(tasksDir, { recursive: true });
      const files = await fs.readdir(tasksDir);
      
      const tasks = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async (file) => {
            const data = await fs.readFile(
              path.join(tasksDir, file),
              'utf-8'
            );
            return JSON.parse(data);
          })
      );
      
      // Apply filters if provided
      let results = tasks;
      
      if (filter) {
        if (filter.status) {
          results = results.filter(task => task.status === filter.status);
        }
        
        if (filter.type) {
          results = results.filter(task => task.type === filter.type);
        }
        
        if (filter.priority) {
          results = results.filter(task => task.priority === filter.priority);
        }
      }
      
      return results;
    },
    
    async clear(): Promise<void> {
      // Remove all content files
      try {
        const contentFiles = await fs.readdir(contentDir);
        await Promise.all(
          contentFiles.map(file => 
            fs.unlink(path.join(contentDir, file))
          )
        );
      } catch (error) {
        // Ignore errors if directory doesn't exist
      }
      
      // Remove all task files
      try {
        const taskFiles = await fs.readdir(tasksDir);
        await Promise.all(
          taskFiles.map(file => 
            fs.unlink(path.join(tasksDir, file))
          )
        );
      } catch (error) {
        // Ignore errors if directory doesn't exist
      }
    },
    
    async stats(): Promise<{ size: number; items: number }> {
      try {
        await fs.mkdir(contentDir, { recursive: true });
        const files = await fs.readdir(contentDir);
        
        let totalSize = 0;
        for (const file of files) {
          const stats = await fs.stat(path.join(contentDir, file));
          totalSize += stats.size;
        }
        
        return {
          size: totalSize,
          items: files.length
        };
      } catch (error) {
        return { size: 0, items: 0 };
      }
    }
  };
}