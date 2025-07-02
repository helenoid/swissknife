// src/ai/service.test.ts

import { AIService } from '../../../src/ai/service.js';
import { ModelRegistry } from '../../../src/models/registry.js';
import { logger } from '../../../src/utils/logger.js';
import { Tool } from '../../../src/ai/tools/tool.js';

// Mock dependencies
jest.mock('../../../src/models/registry', () => ({
  ModelRegistry: {
    getInstance: jest.fn(() => ({
      getModel: jest.fn(),
      registerModel: jest.fn(),
    })),
  },
}));

jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../src/ai/tools/tool', () => ({
  Tool: jest.fn(),
}));

describe('AIService', () => {
  let aiService: AIService;
  let modelRegistry: any;

  beforeEach(() => {
    jest.clearAllMocks();
    modelRegistry = ModelRegistry.getInstance();
    aiService = AIService.getInstance();
  });

  it('should initialize correctly', async () => {
    await aiService.initialize();
    expect(logger.info).toHaveBeenCalledWith('Initializing AIService');
    expect(logger.info).toHaveBeenCalledWith('AIService initialized successfully');
  });

  it('should create an agent', async () => {
    const modelId = 'test-model';
    jest.spyOn(modelRegistry, 'getModel').mockResolvedValueOnce({} as any);
    const agent = await aiService.createAgent('test-agent', modelId);
    expect(modelRegistry.getModel).toHaveBeenCalledWith(modelId);
    expect(agent).toBeDefined();
  });

  it('should register a tool', () => {
    const toolName = 'test-tool';
    const tool = { name: toolName } as Tool; // Mock tool object
    aiService.registerTool(tool);
    expect(aiService.getTool(toolName)).toBe(tool);
  });

  it('should process a message', async () => {
    const modelId = 'test-model';
    const systemPrompt = 'Test system prompt';
    const temperature = 0.5;
    aiService.initSession(modelId, systemPrompt, temperature);
    const response = await aiService.processMessage('Test message');
    expect(response).toBeDefined();
  });

  it('should get an agent', () => {
    const agentId = 'test-agent';
    const agent = {} as any;
    aiService['agents'].set(agentId, agent);
    expect(aiService.getAgent(agentId)).toBe(agent);
  });

  it('should get a tool', () => {
    const toolName = 'test-tool';
    const tool = {} as Tool;
    aiService['tools'].set(toolName, tool);
    expect(aiService.getTool(toolName)).toBe(tool);
  });

  it('should get all tools', () => {
    const tool1 = { name: 'tool1' } as Tool;
    const tool2 = { name: 'tool2' } as Tool;
    aiService['tools'].set('tool1', tool1);
    aiService['tools'].set('tool2', tool2);
    expect(aiService.getAllTools()).toEqual([tool1, tool2]);
  });

  it('should set the model for the active agent', async () => {
    const modelId = 'test-model';
    jest.spyOn(modelRegistry, 'getModel').mockResolvedValueOnce({ id: modelId } as any);
    aiService.initSession(modelId, 'system prompt', 0.5);
    await aiService.setModel(modelId);
    expect(modelRegistry.getModel).toHaveBeenCalledWith(modelId);
  });

  it('should set the temperature for the active agent', () => {
    const temperature = 0.7;
    aiService.initSession('model-id', 'system prompt', 0.5);
    aiService.setTemperature(temperature);
    // Access the private property using type assertion
    expect((aiService['activeAgent'] as any)?.agentOptions?.temperature).toBe(temperature);
  });

  it('should get cache statistics', () => {
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

  it('should clear the cache', () => {
    aiService['responseCache'].set('key', { response: 'test', timestamp: Date.now() });
    aiService.clearCache();
    expect(aiService['responseCache'].size).toBe(0);
  });
});
