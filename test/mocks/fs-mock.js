/**
 * Mock implementation of Node.js fs module for Jest tests
 */

const path = require('path');
const os = require('os');

// In-memory filesystem simulation
const mockFileSystem = new Map();

// Helper function to resolve paths
function resolvePath(filePath) {
  if (!path.isAbsolute(filePath)) {
    return path.resolve(process.cwd(), filePath);
  }
  return filePath;
}

// Mock fs module
const fs = {
  existsSync: jest.fn((filePath) => {
    const resolved = resolvePath(filePath);
    return mockFileSystem.has(resolved);
  }),

  readFileSync: jest.fn((filePath, encoding = 'utf8') => {
    const resolved = resolvePath(filePath);
    if (!mockFileSystem.has(resolved)) {
      const error = new Error(`ENOENT: no such file or directory, open '${filePath}'`);
      error.code = 'ENOENT';
      error.errno = -2;
      error.syscall = 'open';
      error.path = filePath;
      throw error;
    }
    const content = mockFileSystem.get(resolved);
    return encoding === 'utf8' ? content : Buffer.from(content);
  }),

  writeFileSync: jest.fn((filePath, data, options = {}) => {
    const resolved = resolvePath(filePath);
    const content = typeof data === 'string' ? data : data.toString();
    
    // Ensure directory exists
    const dir = path.dirname(resolved);
    if (!mockFileSystem.has(dir)) {
      mockFileSystem.set(dir, null); // Directory marker
    }
    
    mockFileSystem.set(resolved, content);
  }),

  mkdirSync: jest.fn((dirPath, options = {}) => {
    const resolved = resolvePath(dirPath);
    const { recursive = false } = options;
    
    if (recursive) {
      // Create all parent directories
      const parts = resolved.split(path.sep);
      let current = '';
      for (const part of parts) {
        current = current ? path.join(current, part) : part;
        if (current && !mockFileSystem.has(current)) {
          mockFileSystem.set(current, null); // Directory marker
        }
      }
    } else {
      // Check if parent exists
      const parent = path.dirname(resolved);
      if (parent !== resolved && !mockFileSystem.has(parent)) {
        const error = new Error(`ENOENT: no such file or directory, mkdir '${dirPath}'`);
        error.code = 'ENOENT';
        error.errno = -2;
        error.syscall = 'mkdir';
        error.path = dirPath;
        throw error;
      }
      mockFileSystem.set(resolved, null); // Directory marker
    }
  }),

  rmSync: jest.fn((filePath, options = {}) => {
    const resolved = resolvePath(filePath);
    const { recursive = false, force = false } = options;
    
    if (!mockFileSystem.has(resolved)) {
      if (!force) {
        const error = new Error(`ENOENT: no such file or directory, rm '${filePath}'`);
        error.code = 'ENOENT';
        error.errno = -2;
        error.syscall = 'rm';
        error.path = filePath;
        throw error;
      }
      return;
    }
    
    if (recursive) {
      // Remove all files/directories that start with this path
      const toDelete = [];
      for (const [key] of mockFileSystem) {
        if (key.startsWith(resolved)) {
          toDelete.push(key);
        }
      }
      toDelete.forEach(key => mockFileSystem.delete(key));
    } else {
      mockFileSystem.delete(resolved);
    }
  }),

  // Mock fs.promises with async versions
  promises: {
    readFile: jest.fn(async (filePath, encoding = 'utf8') => {
      return fs.readFileSync(filePath, encoding);
    }),

    writeFile: jest.fn(async (filePath, data, options = {}) => {
      return fs.writeFileSync(filePath, data, options);
    }),

    mkdir: jest.fn(async (dirPath, options = {}) => {
      return fs.mkdirSync(dirPath, options);
    }),

    rm: jest.fn(async (filePath, options = {}) => {
      return fs.rmSync(filePath, options);
    }),

    access: jest.fn(async (filePath, mode) => {
      const resolved = resolvePath(filePath);
      if (!mockFileSystem.has(resolved)) {
        const error = new Error(`ENOENT: no such file or directory, access '${filePath}'`);
        error.code = 'ENOENT';
        error.errno = -2;
        error.syscall = 'access';
        error.path = filePath;
        throw error;
      }
    }),
  },
};

// Mock constants
fs.constants = {
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,
};

// Utility functions for tests
fs.__setMockFile = (filePath, content) => {
  const resolved = resolvePath(filePath);
  mockFileSystem.set(resolved, content);
};

fs.__clearMockFiles = () => {
  mockFileSystem.clear();
};

fs.__getMockFiles = () => {
  return new Map(mockFileSystem);
};

fs.__setMockDir = (dirPath) => {
  const resolved = resolvePath(dirPath);
  mockFileSystem.set(resolved, null);
};

module.exports = fs;
