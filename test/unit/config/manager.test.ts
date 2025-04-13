// Mock the 'fs' and 'fs/promises' modules before importing ConfigManager
// Also mock logger to suppress output during tests
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  statSync: jest.fn(() => ({ isDirectory: () => true })),
}));
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
  stat: jest.fn(),
  readdir: jest.fn(),
  mkdir: jest.fn(),
}));
// Import logger mock *before* ConfigManager
const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
jest.mock('@/utils/logger.js', () => ({ logger: mockLogger }));

// Mock singleton ConfigManager by mocking getInstance
const mockGetInstance = jest.fn();
jest.mock('@/config/manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getInstance: mockGetInstance,
    get: jest.fn(),
    set: jest.fn(),
    saveConfig: jest.fn(),
    getFullConfig: jest.fn().mockReturnValue({}),
  })),
}));


import { ConfigManager, Config } from '@/config/manager.js'; // Use alias
import fs from 'fs'; // Import the mocked version
import path from 'path';
import os from 'os';
import { z } from 'zod'; // Import Zod for validation test

// Helper to reset the singleton instance between tests
const resetConfigManagerSingleton = () => {
  (ConfigManager as any).instance = undefined;
};

describe('ConfigManager', () => {
  let mockFs: jest.Mocked<typeof fs>;
  const testConfigDir = path.join(os.homedir(), '.config', 'swissknife');
  const testConfigPath = path.join(testConfigDir, 'config.json');
  // Define schema used by ConfigManager for default generation and validation test
  const ConfigSchema = z.object({
      storage: z.object({
        provider: z.enum(['local', 'ipfs']).default('ipfs'),
        mcp: z.object({
          baseUrl: z.string().url().default('http://localhost:5001'),
          authType: z.enum(['apiKey', 'token']).optional(),
          authValue: z.string().optional(),
        }).optional(),
        localPath: z.string().optional(),
      }).default({ provider: 'ipfs' }),
      ai: z.object({
        defaultModel: z.string().optional(),
        models: z.object({
          providers: z.record(z.string(), z.object({ apiKey: z.string().optional() })).optional(),
        }).optional(),
      }).default({}),
      logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
      newSection: z.object({ deep: z.object({ key: z.string() }) }).optional(), // Add for set test
      optionalVal: z.string().optional(), // Add optional value for testing
    }).default({});
  const mockDefaultConfig = ConfigSchema.parse({}); // Generate default based on schema

  beforeEach(() => {
    jest.clearAllMocks();
    resetConfigManagerSingleton();
    mockFs = fs as jest.Mocked<typeof fs>;
    mockFs.existsSync.mockReturnValue(false);
  });

  // --- Initialization Tests ---
  it('should initialize with default config if file does not exist', () => {
    const manager = ConfigManager.getInstance();
    expect(manager.getFullConfig()).toEqual(mockDefaultConfig);
    expect(mockFs.mkdirSync).toHaveBeenCalledWith(testConfigDir, { recursive: true });
    expect(mockFs.writeFileSync).toHaveBeenCalledWith(testConfigPath, JSON.stringify(mockDefaultConfig, null, 2));
  });

  it('should load config from existing file', () => {
    const existingConfig = {
      storage: { provider: 'local', localPath: '/tmp/storage' },
      ai: { defaultModel: 'test-model' },
      logLevel: 'debug'
    };
    const validExistingConfig = ConfigSchema.parse(existingConfig);
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(existingConfig));

    const manager = ConfigManager.getInstance();
    expect(manager.getFullConfig()).toEqual(validExistingConfig);
    expect(mockFs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should handle invalid JSON in config file and use defaults', () => {
     mockFs.existsSync.mockReturnValue(true);
     mockFs.readFileSync.mockReturnValue("{ invalid json");

     const manager = ConfigManager.getInstance();
     expect(manager.getFullConfig()).toEqual(mockDefaultConfig);
     expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error loading or parsing config file'), expect.any(SyntaxError));
     expect(mockFs.writeFileSync).toHaveBeenCalledWith(testConfigPath, JSON.stringify(mockDefaultConfig, null, 2));
  });

   it('should handle schema validation failure on load and use defaults', () => {
     const invalidSchemaConfig = { storage: { provider: 'invalid' } };
     mockFs.existsSync.mockReturnValue(true);
     mockFs.readFileSync.mockReturnValue(JSON.stringify(invalidSchemaConfig));

     const manager = ConfigManager.getInstance();
     expect(manager.getFullConfig()).toEqual(mockDefaultConfig);
     expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error loading or parsing config file'), expect.any(z.ZodError));
     expect(mockFs.writeFileSync).toHaveBeenCalledWith(testConfigPath, JSON.stringify(mockDefaultConfig, null, 2));
  });

  it('should handle readFileSync error and use defaults', () => {
     mockFs.existsSync.mockReturnValue(true);
     const readError = new Error("Permission denied");
     mockFs.readFileSync.mockImplementation(() => { throw readError; });

     const manager = ConfigManager.getInstance();
     expect(manager.getFullConfig()).toEqual(mockDefaultConfig);
     expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error loading or parsing config file'), readError);
     // Should it try to save default if reading fails? Current impl does.
     expect(mockFs.writeFileSync).toHaveBeenCalledWith(testConfigPath, JSON.stringify(mockDefaultConfig, null, 2));
  });

  it('should handle mkdirSync error during initialization (when saving default)', () => {
     mockFs.existsSync.mockReturnValue(false); // File doesn't exist
     const mkdirError = new Error("EACCES: permission denied");
     mockFs.mkdirSync.mockImplementation(() => { throw mkdirError; });

     const manager = ConfigManager.getInstance(); // Constructor calls loadConfig -> saveConfig
     expect(manager.getFullConfig()).toEqual(mockDefaultConfig); // Still returns default
     expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error saving config file'), mkdirError);
     expect(mockFs.writeFileSync).not.toHaveBeenCalled(); // Save fails because mkdir failed
  });

   it('should handle writeFileSync error during initialization (when saving default)', () => {
     mockFs.existsSync.mockReturnValue(false); // File doesn't exist
     const writeError = new Error("Disk full");
     mockFs.writeFileSync.mockImplementation(() => { throw writeError; });

     const manager = ConfigManager.getInstance(); // Constructor calls loadConfig -> saveConfig
     expect(manager.getFullConfig()).toEqual(mockDefaultConfig); // Still returns default
     expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error saving config file'), writeError);
  });


  // --- Get Method Tests ---
  it('should get top-level values', () => {
    const manager = ConfigManager.getInstance();
    expect(manager.get('logLevel')).toBe('info');
    expect(manager.get('nonexistent', 'defaultVal')).toBe('defaultVal');
    expect(manager.get('nonexistent')).toBeUndefined();
  });

  it('should get nested values using dot notation', () => {
     const existingConfig = {
      storage: { provider: 'local', localPath: '/tmp/storage', mcp: { baseUrl: 'test-url' } },
      ai: { defaultModel: 'test-model', models: { providers: { test: { apiKey: '123'} } } },
    };
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify(existingConfig));

    const manager = ConfigManager.getInstance();
    expect(manager.get('storage.provider')).toBe('local');
    expect(manager.get('storage.mcp.baseUrl')).toBe('test-url');
    expect(manager.get('ai.defaultModel')).toBe('test-model');
    expect(manager.get('ai.models.providers.test.apiKey')).toBe('123');
    expect(manager.get('storage.nonexistent.key')).toBeUndefined();
    expect(manager.get('storage.nonexistent.key', 'fallback')).toBe('fallback');
    expect(manager.get('ai.models.providers.nonexistent')).toBeUndefined();
  });

  it('should return undefined if intermediate path does not exist in get', () => {
    const manager = ConfigManager.getInstance();
    expect(manager.get('ai.models.nonexistent.key')).toBeUndefined();
    expect(manager.get('nonexistent.deep.key')).toBeUndefined();
  });

  it('should return default value if key exists but value is undefined', () => {
     const existingConfig = { optionalVal: undefined };
     mockFs.existsSync.mockReturnValue(true);
     mockFs.readFileSync.mockReturnValue(JSON.stringify(existingConfig));
     const manager = ConfigManager.getInstance();
     expect(manager.get('optionalVal', 'default')).toBe('default');
  });

  it('should return actual value (even null) if key exists', () => {
     const existingConfig = { optionalVal: null };
     mockFs.existsSync.mockReturnValue(true);
     mockFs.readFileSync.mockReturnValue(JSON.stringify(existingConfig));
     const manager = ConfigManager.getInstance();
     expect(manager.get('optionalVal', 'default')).toBeNull();
  });

  // --- Set Method Tests ---
  it('should set top-level values and save', () => {
    const manager = ConfigManager.getInstance();
    manager.set('logLevel', 'debug');
    expect(manager.get('logLevel')).toBe('debug');
    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);
    const savedConfig = JSON.parse(mockFs.writeFileSync.mock.calls[1][1] as string);
    expect(savedConfig.logLevel).toBe('debug');
  });

  it('should set nested values using dot notation and save', () => {
    const manager = ConfigManager.getInstance();
    manager.set('ai.models.providers.openai.apiKey', 'sk-123');
    expect(manager.get('ai.models.providers.openai.apiKey')).toBe('sk-123');

    manager.set('storage.mcp.baseUrl', 'http://new-url:5001');
    expect(manager.get('storage.mcp.baseUrl')).toBe('http://new-url:5001');

    expect(mockFs.writeFileSync).toHaveBeenCalledTimes(3);
    const savedConfig = JSON.parse(mockFs.writeFileSync.mock.calls[2][1] as string);
    expect(savedConfig.ai.models.providers.openai.apiKey).toBe('sk-123');
    expect(savedConfig.storage.mcp.baseUrl).toBe('http://new-url:5001');
  });

   it('should create nested objects when setting deep paths', () => {
    const manager = ConfigManager.getInstance();
    manager.set('newSection.deep.key', 'value');
    expect(manager.get('newSection.deep.key')).toBe('value');
    const savedConfig = JSON.parse(mockFs.writeFileSync.mock.calls[1][1] as string);
    expect(savedConfig.newSection.deep.key).toBe('value');
  });

  it('should overwrite existing primitive value when setting nested object', () => {
    const manager = ConfigManager.getInstance();
    manager.set('logLevel', 'debug');
    manager.set('logLevel.nested', 'should_not_work_well');
    expect(manager.get('logLevel.nested')).toBeUndefined();
    expect(manager.get('logLevel')).toEqual({ nested: 'should_not_work_well' });
  });

  it('should set value to undefined and save', () => {
     const manager = ConfigManager.getInstance();
     manager.set('optionalVal', 'initial');
     expect(manager.get('optionalVal')).toBe('initial');
     mockFs.writeFileSync.mockClear();

     manager.set('optionalVal', undefined);
     expect(manager.get('optionalVal')).toBeUndefined();
     expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
     const savedConfig = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
     expect(savedConfig.optionalVal).toBeUndefined();
     expect('optionalVal' in savedConfig).toBe(true);
  });

  it('should set value to null and save', () => {
     const manager = ConfigManager.getInstance();
     manager.set('optionalVal', 'initial');
     expect(manager.get('optionalVal')).toBe('initial');
     mockFs.writeFileSync.mockClear();

     manager.set('optionalVal', null);
     expect(manager.get('optionalVal')).toBeNull();
     expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
     const savedConfig = JSON.parse(mockFs.writeFileSync.mock.calls[0][1] as string);
     expect(savedConfig.optionalVal).toBeNull();
  });

  // --- Validation on Set Test ---
  it('should not save if validation fails after set', () => {
     const manager = ConfigManager.getInstance();
     mockFs.writeFileSync.mockClear();

     manager.set('logLevel', 'invalid-level');

     expect(manager.get('logLevel')).toBe(mockDefaultConfig.logLevel);
     expect(mockFs.writeFileSync).not.toHaveBeenCalled();
     expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to set config key'), expect.any(z.ZodError));
  });

  // --- Save Method Error Handling ---
  it('should log error if save fails', () => {
     const manager = ConfigManager.getInstance();
     const saveError = new Error("Cannot write");
     mockFs.writeFileSync.mockImplementation(() => { throw saveError; });
     mockFs.writeFileSync.mockClear(); // Clear initial save call

     manager.set('logLevel', 'warn'); // This triggers save

     expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error saving config file'), saveError);
  });


  // --- getFullConfig Test ---
  it('should return a deep clone from getFullConfig', () => {
    const manager = ConfigManager.getInstance();
    const config1 = manager.getFullConfig();
    const config2 = manager.getFullConfig();

    expect(config1).toEqual(config2);
    expect(config1).not.toBe(config2);

    config1.logLevel = 'debug';
    expect(manager.getFullConfig().logLevel).toBe('info');
  });

});
