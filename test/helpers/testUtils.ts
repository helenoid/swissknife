/**
 * Common test utilities for SwissKnife testing
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

/**
 * Creates a temporary directory for test files
 */
export async function createTempTestDir(prefix = 'swissknife-test-'): Promise<string> {
  const tempDir = path.join(os.tmpdir(), `${prefix}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Removes a temporary test directory
 */
export async function removeTempTestDir(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    // Ignore errors (e.g., if directory doesn't exist)
    console.warn(`Warning: Could not remove temp directory ${tempDir}:`, error);
  }
}

/**
 * Creates a temporary configuration file for testing
 */
export async function createTempConfigFile(config: Record<string, any>): Promise<string> {
  const tempDir = await createTempTestDir();
  const configPath = path.join(tempDir, 'config.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
  return configPath;
}

/**
 * Mocks environment variables for testing and returns a function to restore them
 */
export function mockEnv(envVars: Record<string, string | undefined>): () => void {
  const originalEnv = { ...process.env };
  
  // Set mock environment variables
  Object.entries(envVars).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  });
  
  // Return a function to restore original environment
  return () => {
    // Restore original environment
    Object.keys(envVars).forEach(key => {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  };
}

/**
 * Waits for a specified condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();
  
  while (true) {
    if (await condition()) {
      return;
    }
    
    if (Date.now() - startTime >= timeout) {
      throw new Error(`Condition not met within timeout of ${timeout}ms`);
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Creates a deferred promise that can be resolved/rejected externally
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}

/**
 * Captures console output for testing
 */
export function captureConsoleOutput(): {
  getOutput: () => { log: string[]; error: string[]; warn: string[] };
  restore: () => void;
} {
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn
  };
  
  const output = {
    log: [] as string[],
    error: [] as string[],
    warn: [] as string[]
  };
  
  console.log = (...args: any[]) => {
    output.log.push(args.map(arg => String(arg)).join(' '));
  };
  
  console.error = (...args: any[]) => {
    output.error.push(args.map(arg => String(arg)).join(' '));
  };
  
  console.warn = (...args: any[]) => {
    output.warn.push(args.map(arg => String(arg)).join(' '));
  };
  
  return {
    getOutput: () => output,
    restore: () => {
      console.log = originalConsole.log;
      console.error = originalConsole.error;
      console.warn = originalConsole.warn;
    }
  };
}

/**
 * Mocks the current working directory for testing
 */
export function mockCwd(dir: string): () => void {
  const originalCwd = process.cwd;
  process.cwd = () => dir;
  return () => {
    process.cwd = originalCwd;
  };
}