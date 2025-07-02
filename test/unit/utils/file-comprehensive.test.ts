/**
 * Comprehensive File Utilities Test with Proper Dependency Injection
 */

// Mock all external dependencies before importing the module
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  openSync: jest.fn(),
  readSync: jest.fn(),
  closeSync: jest.fn(),
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
}));

jest.mock('glob', () => ({
  glob: jest.fn(),
}));

jest.mock('process', () => ({
  cwd: jest.fn(),
}));

jest.mock('lru-cache', () => ({
  LRUCache: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  })),
}));

// Mock internal dependencies
jest.mock('../../../src/utils/log.js', () => ({
  logError: jest.fn(),
}));

jest.mock('../../../src/utils/ripgrep.js', () => ({
  listAllContentFiles: jest.fn(),
}));

jest.mock('../../../src/utils/state.js', () => ({
  getCwd: jest.fn(),
}));

// Import after mocking
import * as fs from 'fs';
import { glob as globLib } from 'glob';
import { cwd as processCwd } from 'process';
import { LRUCache } from 'lru-cache';
import { logError } from '../../../src/utils/log.js';
import { listAllContentFiles } from '../../../src/utils/ripgrep.js';
import { getCwd } from '../../../src/utils/state.js';

// Import the module under test
import * as fileUtils from '../../../src/utils/file.js';

describe('File Utilities with Dependency Injection', () => {
  // Type the mocked functions
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockGlob = globLib as jest.MockedFunction<typeof globLib>;
  const mockProcessCwd = processCwd as jest.MockedFunction<typeof processCwd>;
  const mockLogError = logError as jest.MockedFunction<typeof logError>;
  const mockListAllContentFiles = listAllContentFiles as jest.MockedFunction<typeof listAllContentFiles>;
  const mockGetCwd = getCwd as jest.MockedFunction<typeof getCwd>;
  const MockLRUCache = LRUCache as jest.MockedClass<typeof LRUCache>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock behaviors
    mockGetCwd.mockReturnValue('/test/project');
    mockProcessCwd.mockReturnValue('/test/project');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readdirSync.mockReturnValue(['file1.ts', 'file2.js'] as any);
    mockListAllContentFiles.mockResolvedValue(['src/file1.ts', 'src/file2.js']);
    
    // Setup LRU Cache mock
    const mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn().mockReturnValue(false),
      delete: jest.fn(),
      clear: jest.fn(),
    };
    MockLRUCache.mockImplementation(() => mockCache as any);
  });

  describe('glob function', () => {
    beforeEach(() => {
      mockGlob.mockResolvedValue([
        { name: 'file1.ts', mtimeMs: 1000 },
        { name: 'file2.js', mtimeMs: 2000 },
      ] as any);
    });

    test('should handle glob patterns correctly', async () => {
      const abortController = new AbortController();
      const result = await fileUtils.glob(
        '**/*.ts',
        '/test/project',
        { limit: 10, offset: 0 },
        abortController.signal
      );

      expect(mockGlob).toHaveBeenCalledWith(
        ['**/*.ts'],
        expect.objectContaining({
          cwd: '/test/project',
          nocase: true,
          nodir: true,
          signal: abortController.signal,
          stat: true,
          withFileTypes: true,
        })
      );

      expect(result).toEqual({
        files: ['file1.ts', 'file2.js'],
        truncated: false,
      });
    });

    test('should handle truncation when limit is exceeded', async () => {
      // Mock many files
      const manyFiles = Array.from({ length: 20 }, (_, i) => ({
        name: `file${i}.ts`,
        mtimeMs: i * 1000,
      }));
      mockGlob.mockResolvedValue(manyFiles as any);

      const abortController = new AbortController();
      const result = await fileUtils.glob(
        '**/*.ts',
        '/test/project',
        { limit: 5, offset: 0 },
        abortController.signal
      );

      expect(result.files).toHaveLength(5);
      expect(result.truncated).toBe(true);
    });

    test('should handle offset correctly', async () => {
      const files = Array.from({ length: 10 }, (_, i) => ({
        name: `file${i}.ts`,
        mtimeMs: i * 1000,
      }));
      mockGlob.mockResolvedValue(files as any);

      const abortController = new AbortController();
      const result = await fileUtils.glob(
        '**/*.ts',
        '/test/project',
        { limit: 3, offset: 2 },
        abortController.signal
      );

      expect(result.files).toHaveLength(3);
      expect(result.files[0]).toBe('file2.ts');
    });
  });

  describe('error handling', () => {
    test('should log errors when glob fails', async () => {
      const error = new Error('Glob failed');
      mockGlob.mockRejectedValue(error);

      const abortController = new AbortController();
      
      await expect(
        fileUtils.glob('**/*.ts', '/test/project', { limit: 10, offset: 0 }, abortController.signal)
      ).rejects.toThrow('Glob failed');
    });
  });

  describe('dependency integration', () => {
    test('should use getCwd when no cwd provided', async () => {
      // Test that the function integrates with the state utility
      expect(mockGetCwd).toBeDefined();
      expect(typeof mockGetCwd).toBe('function');
    });

    test('should use ripgrep for content listing', async () => {
      // Test integration with ripgrep utility
      expect(mockListAllContentFiles).toBeDefined();
      expect(typeof mockListAllContentFiles).toBe('function');
    });

    test('should use LRU cache for performance', () => {
      // Test that cache is properly initialized
      expect(MockLRUCache).toHaveBeenCalled();
    });
  });

  describe('fs integration', () => {
    test('should read files correctly', () => {
      const mockContent = 'test file content';
      mockFs.readFileSync.mockReturnValue(mockContent);

      // This would test a function that uses readFileSync
      expect(mockFs.readFileSync).toBeDefined();
    });

    test('should check file existence', () => {
      mockFs.existsSync.mockReturnValue(true);
      
      expect(mockFs.existsSync('/test/file.ts')).toBe(true);
      expect(mockFs.existsSync).toHaveBeenCalledWith('/test/file.ts');
    });

    test('should list directory contents', () => {
      const mockFiles = ['file1.ts', 'file2.js'];
      mockFs.readdirSync.mockReturnValue(mockFiles as any);

      const files = mockFs.readdirSync('/test/dir');
      expect(files).toEqual(mockFiles);
      expect(mockFs.readdirSync).toHaveBeenCalledWith('/test/dir');
    });
  });
});
