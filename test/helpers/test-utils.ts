// Mock common dependencies
jest.mock("chalk", () => ({ default: (str: any) => str, red: (str: any) => str, green: (str: any) => str, blue: (str: any) => str }));
jest.mock("nanoid", () => ({ nanoid: () => "test-id" }));
jest.mock("fs", () => ({ promises: { readFile: jest.fn(), writeFile: jest.fn(), mkdir: jest.fn() } }));

/**
 * Test Utilities for SwissKnife
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

/**
 * Create a temporary directory for testing
 * @param name Optional name for the directory
 * @returns {Promise<string>} Path to the created directory
 */
export async function createTempTestDir(name?: string): Promise<string> {
  const suffix = name ? `-${name}` : '';
  const tempDir = path.join(os.tmpdir(), `swissknife-test${suffix}-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Remove a temporary test directory
 * @param {string} dirPath Path to the directory to remove
 */
export async function removeTempTestDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (err: any) {
    // Ignore errors if the directory doesn't exist
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

/**
 * Create a file with test content
 * @param {string} filePath Path to create the file
 * @param {string} content Content to write to the file
 */
export async function createTestFile(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Read the content of a test file
 * @param {string} filePath Path to the file to read
 * @returns {Promise<string>} Content of the file
 */
export async function readTestFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Mock environment variables for testing
 * @param envVars Object containing environment variables to mock
 * @returns Function to restore original environment variables
 */
export function mockEnv(envVars: Record<string, string>): () => void {
  const originalEnv: Record<string, string | undefined> = {};
  
  // Store original values
  for (const key in envVars) {
    originalEnv[key] = process.env[key];
    process.env[key] = envVars[key];
  }
  
  // Return restore function
  return () => {
    for (const key in originalEnv) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  };
}

/**
 * Wait for a specified amount of time
 * @param ms Milliseconds to wait
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a spy that can be used to track function calls
 * @param implementation Optional implementation for the spy
 */
export function createSpy<T extends (...args: any[]) => any>(implementation?: T): jest.Mock {
  return jest.fn(implementation);
}

/**
 * Assert that a promise rejects with a specific error message
 * @param promise Promise that should reject
 * @param expectedMessage Expected error message or pattern
 */
export async function expectToThrow(
  promise: Promise<any>,
  expectedMessage?: string | RegExp
): Promise<void> {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error: any) {
    if (expectedMessage) {
      if (typeof expectedMessage === 'string') {
        expect(error.message).toContain(expectedMessage);
      } else {
        expect(error.message).toMatch(expectedMessage);
      }
    }
  }
}
