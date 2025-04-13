/**
 * Tests for the Goose Integration Bridge
 */

import { GooseBridge } from '../../../src/integration/bridges/goose-bridge';
import { IntegrationRegistry } from '../../../src/integration/registry';

// Mock the IntegrationRegistry
jest.mock('../../../src/integration/registry', () => {
  // Create a mock implementation of the registry
  const mockRegistry = {
    bridges: new Map(),
    registerBridge: jest.fn(function(bridge) {
      this.bridges.set(bridge.id, bridge);
    }),
    getBridge: jest.fn(function(id) {
      return this.bridges.get(id);
    }),
    getAllBridges: jest.fn(function() {
      return Array.from(this.bridges.values());
    }),
    getBridgesByTarget: jest.fn(function(target) {
      return Array.from(this.bridges.values()).filter(b => b.target === target);
    }),
    initializeBridge: jest.fn(async function(id) {
      const bridge = this.bridges.get(id);
      if (bridge) {
        return bridge.initialize();
      }
      return false;
    })
  };
  
  return {
    IntegrationRegistry: {
      getInstance: jest.fn(() => mockRegistry)
    }
  };
});

// Mock the LogManager and ConfigurationManager
jest.mock('../../../src/utils/logging/manager', () => ({
  LogManager: {
    getInstance: jest.fn().mockReturnValue({
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    })
  }
}));

jest.mock('../../../src/config/manager', () => ({
  ConfigurationManager: {
    getInstance: jest.fn().mockReturnValue({
      get: jest.fn().mockImplementation((key, defaultValue) => defaultValue)
    })
  }
}));

describe('GooseBridge', () => {
  let bridge;
  let registry;
  
  beforeEach(() => {
    // Reset mock registry state
    const mockRegistry = IntegrationRegistry.getInstance();
    mockRegistry.bridges.clear();
    
    bridge = new GooseBridge({
      endpoint: 'http://test-endpoint',
      timeout: 5000,
      maxRetries: 2
    });
    
    registry = IntegrationRegistry.getInstance();
    registry.registerBridge(bridge);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should have the correct ID and name', () => {
    expect(bridge.id).toBe('goose-main');
    expect(bridge.name).toBe('Goose AI Bridge');
    expect(bridge.source).toBe('current');
    expect(bridge.target).toBe('goose');
  });

  test('should initialize successfully', async () => {
    const result = await bridge.initialize();
    expect(result).toBe(true);
    expect(bridge.isInitialized()).toBe(true);
  });
  
  test('should throw an error when calling methods without initialization', async () => {
    const uninitializedBridge = new GooseBridge();
    
    await expect(uninitializedBridge.call('getVersion', {}))
      .rejects.toThrow('Goose bridge not initialized');
  });

  test('should return version information', async () => {
    await bridge.initialize();
    const result = await bridge.call('getVersion', {});
    expect(result).toHaveProperty('version');
  });

  test('should list available models', async () => {
    await bridge.initialize();
    const models = await bridge.call('listModels', {});
    
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty('id');
    expect(models[0]).toHaveProperty('name');
    expect(models[0]).toHaveProperty('provider');
  });

  test('should list available tools', async () => {
    await bridge.initialize();
    const tools = await bridge.call('listTools', {});
    
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
    expect(tools[0]).toHaveProperty('name');
    expect(tools[0]).toHaveProperty('description');
  });

  test('should process a message', async () => {
    await bridge.initialize();
    const response = await bridge.call('processMessage', { message: 'Hello, world!' });
    
    expect(response).toHaveProperty('messageId');
    expect(response).toHaveProperty('content');
    expect(response.content).toContain('Hello, world!');
  });

  test('should throw an error for unknown methods', async () => {
    await bridge.initialize();
    
    await expect(bridge.call('unknownMethod', {}))
      .rejects.toThrow('Unknown method: unknownMethod');
  });

  test('should be registered and accessible in the registry', async () => {
    const retrievedBridge = registry.getBridge('goose-main');
    expect(retrievedBridge).toBe(bridge);
    
    const gooseBridges = registry.getBridgesByTarget('goose');
    expect(gooseBridges).toContain(bridge);
  });
});