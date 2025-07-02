// Mock common dependencies
import { jest } from '@jest/globals';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

jest.mock("chalk", () => ({ default: (str: any) => str, red: (str: any) => str, green: (str: any) => str, blue: (str: any) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));

/**
 * Common test helpers and utilities (TypeScript ESM version)
 */

/**
 * Wait for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {Object} options - Options
 * @param {number} options.timeout - Timeout in milliseconds
 * @param {number} options.interval - Check interval in milliseconds
 * @returns {Promise<boolean>} - True if condition was met, false if timed out
 */
export async function waitFor(condition: () => boolean | Promise<boolean>, { timeout = 5000, interval = 100 } = {}): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await Promise.resolve(condition())) {
      return true;
    }
    await wait(interval);
  }
  
  return false;
}

/**
 * Generate a unique ID for test entities
 * @param {string} prefix - ID prefix
 * @returns {string} - Unique ID
 */
export function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a mock function that resolves with the given value after a delay
 * @param {any} resolveValue - Value to resolve with
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Mock function
 */
export function createDelayedMock(resolveValue: any, delay = 10): jest.Mock<any, any, any> {
  return jest.fn().mockImplementation(() => 
    new Promise(resolve => setTimeout(() => resolve(resolveValue), delay))
  );
}

/**
 * Create a mock function that rejects with the given error after a delay
 * @param {Error|string} error - Error to reject with
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Mock function
 */
export function createErrorMock(error: Error | string, delay = 10): jest.Mock<any, any, any> {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  return jest.fn().mockImplementation(() => 
    new Promise((_, reject) => setTimeout(() => reject(errorObj), delay))
  );
}

/**
 * Capture console output for testing
 * @returns {Object} - Object with start and stop methods
 */
export function captureConsoleOutput() {
  const output = {
    log: [] as string[],
    error: [] as string[],
    warn: [] as string[],
    info: [] as string[]
  };
  
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };
  
  function start() {
    // Clear previous output
    output.log = [];
    output.error = [];
    output.warn = [];
    output.info = [];
    
    // Override console methods
    console.log = (...args: any[]) => {
      output.log.push(args.map(String).join(' '));
    };
    
    console.error = (...args: any[]) => {
      output.error.push(args.map(String).join(' '));
    };
    
    console.warn = (...args: any[]) => {
      output.warn.push(args.map(String).join(' '));
    };
    
    console.info = (...args: any[]) => {
      output.info.push(args.map(String).join(' '));
    };
    
    return output;
  }
  
  function stop() {
    // Restore original console methods
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
    console.info = originalConsole.info;
    
    return output;
  }
  
  return { start, stop, output };
}

/**
 * Create a temporary test file
 * @param {string} content - File content
 * @param {string} extension - File extension
 * @returns {Promise<string>} - Path to the created file
 */
export async function createTempFile(content: string, extension = '.json'): Promise<string> {
  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, `swissknife-test-${Date.now()}${extension}`);
  
  await fs.writeFile(filePath, content);
  
  return filePath;
}

/**
 * Delete a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<void>}
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error: any) {
    // Ignore if file doesn't exist
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} - Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Create a mocked event emitter
 * @returns {Object} - Mocked event emitter
 */
export function createMockEventEmitter() {
  const listeners: Record<string, Function[]> = {};
  
  return {
    on: jest.fn((event: string, listener: Function) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(listener);
    }),
    
    off: jest.fn((event: string, listener: Function) => {
      if (!listeners[event]) return;
      
      const index = listeners[event].indexOf(listener);
      if (index !== -1) {
        listeners[event].splice(index, 1);
      }
    }),
    
    emit: jest.fn((event: string, ...args: any[]) => {
      if (!listeners[event]) return false;
      
      for (const listener of listeners[event]) {
        listener(...args);
      }
      
      return true;
    }),
    
    // Helper method to get all listeners for testing
    getListeners: (event: string) => {
      return listeners[event] || [];
    },
    
    // Helper method to clear all listeners for testing
    clearListeners: () => {
      for (const event in listeners) {
        listeners[event] = [];
      }
    }
  };
}

// Assuming this is a separate file or needs to be mocked
// import { sampleConfigurations } from '../fixtures/config/config';

export function generateConfigFixtures() {
  // This function needs to be properly implemented or mocked if it relies on external data
  // For now, returning a placeholder
  return { basic: { /* mock config data */ } };
}
