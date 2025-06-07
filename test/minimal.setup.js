/**
 * Minimal Jest setup for LogManager tests
 */

// Set NODE_ENV to 'test'
process.env.NODE_ENV = 'test';

// Configure global testing timeouts - we'll omit this to avoid issues
// jest.setTimeout(30000);

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('mock file content'),
  mkdir: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({ isDirectory: () => true })
}));
