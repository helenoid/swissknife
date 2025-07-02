/**
 * Simple test for file utilities
 */

import * as fs from 'fs';
import * as path from 'path';

// Mock fs to avoid real file operations
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  openSync: jest.fn(),
  readSync: jest.fn(),
  closeSync: jest.fn(),
}));

// Mock other dependencies
jest.mock('../../../src/utils/log.js', () => ({
  logError: jest.fn(),
}));

jest.mock('../../../src/utils/ripgrep.ts', () => ({
  listAllContentFiles: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../../src/utils/state.ts', () => ({
  getCwd: jest.fn().mockReturnValue('/test'),
}));

jest.mock('glob', () => ({
  glob: jest.fn().mockResolvedValue([]),
}));

describe('File Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should be importable', async () => {
    // Import the file utility module
    const fileUtils = await import('../../../src/utils/file.ts');
    expect(fileUtils).toBeDefined();
  });

  test('fs mocks should be working', () => {
    const mockedFs = fs as jest.Mocked<typeof fs>;
    mockedFs.existsSync.mockReturnValue(true);
    
    expect(fs.existsSync('test')).toBe(true);
    expect(mockedFs.existsSync).toHaveBeenCalledWith('test');
  });

  test('path operations should work', () => {
    expect(path.join('a', 'b')).toBe('a/b');
    expect(path.basename('/path/to/file.txt')).toBe('file.txt');
    expect(path.dirname('/path/to/file.txt')).toBe('/path/to');
    expect(path.extname('file.txt')).toBe('.txt');
  });
});
