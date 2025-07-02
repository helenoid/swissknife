// Simple Jest setup
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: console.warn,
  error: console.error
};

// Set test environment
process.env.NODE_ENV = 'test';

// Global timeout
jest.setTimeout(10000);

// Mock common modules
jest.mock('child_process', () => ({
  exec: jest.fn((cmd, callback) => callback(null, { stdout: 'mock', stderr: '' })),
  spawn: jest.fn(() => ({
    on: jest.fn(),
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() }
  }))
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue('mock content'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined)
}));

console.log('Simple Jest setup loaded');
