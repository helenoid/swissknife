/**
 * Comprehensive Configuration Manager Test with Dependency Injection
 */

// Mock all file system and OS dependencies
jest.mock('path', () => ({
  join: jest.fn((...parts: string[]) => parts.join('/')),
  dirname: jest.fn((filePath: string) => filePath.split('/').slice(0, -1).join('/')),
  exists: jest.fn(),
}));

jest.mock('os', () => ({
  homedir: jest.fn(() => '/home/testuser'),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  access: jest.fn(),
}));

// Mock logger
jest.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { ConfigManager, IConfigManager } from '../../../src/config/manager.js';
import { logger } from '../../../src/utils/logger.js';

describe('ConfigManager Comprehensive Tests', () => {
  let configManager: ConfigManager;
  let mockPath: jest.Mocked<typeof path>;
  let mockOs: jest.Mocked<typeof os>;
  let mockFs: jest.Mocked<typeof fs>;
  let mockFsPromises: jest.Mocked<typeof fsPromises>;
  let mockLogger: jest.Mocked<typeof logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockPath = path as jest.Mocked<typeof path>;
    mockOs = os as jest.Mocked<typeof os>;
    mockFs = fs as jest.Mocked<typeof fs>;
    mockFsPromises = fsPromises as jest.Mocked<typeof fsPromises>;
    mockLogger = logger as jest.Mocked<typeof logger>;

    // Default mock implementations
    mockOs.homedir.mockReturnValue('/home/testuser');
    mockPath.join.mockImplementation((...parts: string[]) => parts.join('/'));
    mockPath.dirname.mockImplementation((filePath: string) => 
      filePath.split('/').slice(0, -1).join('/')
    );
    mockFs.existsSync.mockReturnValue(true);
    mockFsPromises.access.mockResolvedValue(undefined);
    mockFsPromises.mkdir.mockResolvedValue(undefined);

    // Create new instance for each test
    configManager = new ConfigManager();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(configManager).toBeDefined();
      expect(mockOs.homedir).toHaveBeenCalled();
      expect(mockPath.join).toHaveBeenCalledWith('/home/testuser', '.swissknife', 'config.json');
    });
  });

  describe('initialize', () => {
    it('should initialize successfully when config file exists', async () => {
      const mockConfig = {
        'app.name': 'SwissKnife',
        'app.version': '1.0.0',
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFsPromises.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await configManager.initialize();

      expect(result).toBe(true);
      expect(mockFsPromises.readFile).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Configuration manager initialized successfully');
    });

    it('should create default config when file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFsPromises.mkdir.mockResolvedValue(undefined);
      mockFsPromises.writeFile.mockResolvedValue(undefined);

      const result = await configManager.initialize();

      expect(result).toBe(true);
      expect(mockFsPromises.mkdir).toHaveBeenCalled();
      expect(mockFsPromises.writeFile).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockFs.existsSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const result = await configManager.initialize();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize configuration manager:',
        expect.any(Error)
      );
    });

    it('should not reinitialize if already initialized', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFsPromises.readFile.mockResolvedValue('{}');

      // First initialization
      await configManager.initialize();
      
      // Clear mocks to verify second call behavior
      jest.clearAllMocks();

      // Second initialization
      const result = await configManager.initialize();

      expect(result).toBe(true);
      expect(mockFsPromises.readFile).not.toHaveBeenCalled();
    });
  });

  describe('load', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should load configuration from file', async () => {
      const mockConfig = {
        'ai.openai.apiKey': 'test-key',
        'ai.anthropic.apiKey': 'anthropic-key',
      };

      mockFsPromises.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await configManager.load();

      expect(result).toBe(true);
      expect(mockFsPromises.readFile).toHaveBeenCalled();
    });

    it('should handle corrupted config file', async () => {
      mockFsPromises.readFile.mockResolvedValue('invalid json');

      const result = await configManager.load();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to parse configuration file:',
        expect.any(Error)
      );
    });

    it('should handle file read errors', async () => {
      mockFsPromises.readFile.mockRejectedValue(new Error('Read error'));

      const result = await configManager.load();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('save', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should save configuration to file', async () => {
      mockFsPromises.writeFile.mockResolvedValue(undefined);

      const result = await configManager.save();

      expect(result).toBe(true);
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        expect.any(String),
        'utf8'
      );
    });

    it('should handle save errors', async () => {
      mockFsPromises.writeFile.mockRejectedValue(new Error('Write error'));

      const result = await configManager.save();

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should create directory if it does not exist', async () => {
      mockFsPromises.writeFile
        .mockRejectedValueOnce({ code: 'ENOENT' })
        .mockResolvedValueOnce(undefined);
      mockFsPromises.mkdir.mockResolvedValue(undefined);

      const result = await configManager.save();

      expect(mockFsPromises.mkdir).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('get and set', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should get configuration value', () => {
      // First set a value
      configManager.set('test.key', 'test-value');
      
      const value = configManager.get('test.key');
      expect(value).toBe('test-value');
    });

    it('should return default value when key does not exist', () => {
      const value = configManager.get('nonexistent.key', 'default-value');
      expect(value).toBe('default-value');
    });

    it('should return undefined when key does not exist and no default', () => {
      const value = configManager.get('nonexistent.key');
      expect(value).toBeUndefined();
    });

    it('should set configuration value', async () => {
      mockFsPromises.writeFile.mockResolvedValue(undefined);

      const result = await configManager.set('new.key', 'new-value');

      expect(result).toBe(true);
      expect(configManager.get('new.key')).toBe('new-value');
    });

    it('should handle complex nested values', async () => {
      const complexValue = {
        nested: {
          array: [1, 2, 3],
          object: { a: 1, b: 2 },
        },
      };

      await configManager.set('complex.key', complexValue);
      const retrieved = configManager.get('complex.key');

      expect(retrieved).toEqual(complexValue);
    });
  });

  describe('has', () => {
    beforeEach(async () => {
      await configManager.initialize();
      await configManager.set('existing.key', 'value');
    });

    it('should return true for existing key', () => {
      expect(configManager.has('existing.key')).toBe(true);
    });

    it('should return false for non-existing key', () => {
      expect(configManager.has('nonexistent.key')).toBe(false);
    });
  });

  describe('delete', () => {
    beforeEach(async () => {
      await configManager.initialize();
      await configManager.set('deletable.key', 'value');
    });

    it('should delete existing key', () => {
      expect(configManager.has('deletable.key')).toBe(true);
      
      const result = configManager.delete('deletable.key');
      
      expect(result).toBe(true);
      expect(configManager.has('deletable.key')).toBe(false);
    });

    it('should return false when deleting non-existing key', () => {
      const result = configManager.delete('nonexistent.key');
      expect(result).toBe(false);
    });
  });

  describe('listKeys', () => {
    beforeEach(async () => {
      await configManager.initialize();
      await configManager.set('key1', 'value1');
      await configManager.set('key2', 'value2');
      await configManager.set('nested.key', 'nested-value');
    });

    it('should return all configuration keys', () => {
      const keys = configManager.listKeys();
      
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('nested.key');
      expect(keys.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      await configManager.initialize();
      await configManager.set('public.key', 'public-value');
      await configManager.set('sensitive.apiKey', 'secret-key');
    });

    it('should return all configuration without sensitive data by default', () => {
      const config = configManager.getAll();
      
      expect(config['public.key']).toBe('public-value');
      expect(config['sensitive.apiKey']).toBe('[HIDDEN]');
    });

    it('should return all configuration including sensitive data when requested', () => {
      const config = configManager.getAll(true);
      
      expect(config['public.key']).toBe('public-value');
      expect(config['sensitive.apiKey']).toBe('secret-key');
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      await configManager.initialize();
      await configManager.set('some.key', 'some-value');
    });

    it('should reset configuration to defaults', async () => {
      mockFsPromises.writeFile.mockResolvedValue(undefined);
      
      const result = await configManager.reset();
      
      expect(result).toBe(true);
      expect(configManager.get('some.key')).toBeUndefined();
    });

    it('should handle reset errors', async () => {
      mockFsPromises.writeFile.mockRejectedValue(new Error('Write error'));
      
      const result = await configManager.reset();
      
      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default configuration', () => {
      const defaultConfig = configManager.getDefaultConfig();
      
      expect(defaultConfig).toBeDefined();
      expect(typeof defaultConfig).toBe('object');
      expect(defaultConfig['app.name']).toBe('SwissKnife');
    });
  });

  describe('registerSchema', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should register configuration schema', () => {
      const schema = {
        type: 'string',
        required: true,
        description: 'Test schema',
      };

      expect(() => {
        configManager.registerSchema('test.schema', schema);
      }).not.toThrow();
    });
  });

  describe('singleton behavior', () => {
    it('should return the same instance', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('edge cases', () => {
    beforeEach(async () => {
      await configManager.initialize();
    });

    it('should handle null values', async () => {
      await configManager.set('null.key', null);
      expect(configManager.get('null.key')).toBeNull();
    });

    it('should handle undefined values', async () => {
      await configManager.set('undefined.key', undefined);
      expect(configManager.get('undefined.key')).toBeUndefined();
    });

    it('should handle empty string values', async () => {
      await configManager.set('empty.key', '');
      expect(configManager.get('empty.key')).toBe('');
    });

    it('should handle boolean values', async () => {
      await configManager.set('bool.true', true);
      await configManager.set('bool.false', false);
      
      expect(configManager.get('bool.true')).toBe(true);
      expect(configManager.get('bool.false')).toBe(false);
    });

    it('should handle numeric values', async () => {
      await configManager.set('number.zero', 0);
      await configManager.set('number.negative', -42);
      await configManager.set('number.float', 3.14);
      
      expect(configManager.get('number.zero')).toBe(0);
      expect(configManager.get('number.negative')).toBe(-42);
      expect(configManager.get('number.float')).toBe(3.14);
    });
  });
});
