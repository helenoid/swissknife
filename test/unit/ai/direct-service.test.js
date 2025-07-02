// Direct test for AIService to resolve module resolution issues
import * as path from 'path';
import * as fs from 'fs';

// Mock dependencies manually
jest.mock('../../../src/ai/models/registry.ts', () => ({
  ModelRegistry: {
    getInstance: jest.fn(() => ({
      getModel: jest.fn(),
      registerModel: jest.fn(),
    })),
  },
}));

jest.mock('../../../src/utils/logger.ts', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../src/ai/tools/tool.ts', () => ({
  Tool: jest.fn(),
}));

// Directly import the AI service
const AIServicePath = path.resolve(__dirname, '../../../src/ai/service.ts');
const { AIService } = require(AIServicePath);

// Use Jest globals
const describe = global.describe;
const test = global.test;
const expect = global.expect;
const beforeEach = global.beforeEach;

describe('AIService Direct Test', () => {
  let aiService;
  let modelRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    modelRegistry = require('../../../src/ai/models/registry.ts').ModelRegistry.getInstance();
    aiService = AIService.getInstance();
  });

  test('should initialize correctly', async () => {
    await aiService.initialize();
    const logger = require('../../../src/utils/logger.ts').logger;
    expect(logger.info).toHaveBeenCalledWith('Initializing AIService');
    expect(logger.info).toHaveBeenCalledWith('AIService initialized successfully');
  });

  test('should create an agent', async () => {
    const modelId = 'test-model';
    jest.spyOn(modelRegistry, 'getModel').mockResolvedValueOnce({});
    const agent = await aiService.createAgent('test-agent', modelId);
    expect(modelRegistry.getModel).toHaveBeenCalledWith(modelId);
    expect(agent).toBeDefined();
  });

  test('should register a tool', () => {
    const Tool = require('../../../src/ai/tools/tool.js').Tool;
    const toolName = 'test-tool';
    const tool = { name: toolName };
    aiService.registerTool(tool);
    expect(aiService.getTool(toolName)).toBe(tool);
  });

  test('should get cache statistics', () => {
    aiService['cacheStats'].hits = 10;
    aiService['cacheStats'].misses = 5;
    aiService['cacheStats'].totalRequests = 15;
    // Add items to cache to set size
    aiService['responseCache'].set('key1', { response: 'test1', timestamp: Date.now() });
    aiService['responseCache'].set('key2', { response: 'test2', timestamp: Date.now() });
    aiService['responseCache'].set('key3', { response: 'test3', timestamp: Date.now() });
    aiService['responseCache'].set('key4', { response: 'test4', timestamp: Date.now() });
    aiService['responseCache'].set('key5', { response: 'test5', timestamp: Date.now() });
    const stats = aiService.getCacheStats();
    expect(stats.hits).toBe(10);
    expect(stats.misses).toBe(5);
    expect(stats.totalRequests).toBe(15);
    expect(stats.cacheSize).toBe(5);
  });

  test('should clear the cache', () => {
    aiService['responseCache'].set('key', { response: 'test', timestamp: Date.now() });
    aiService.clearCache();
    expect(aiService['responseCache'].size).toBe(0);
  });
});
