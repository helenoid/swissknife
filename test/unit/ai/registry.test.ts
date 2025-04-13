// Mock logger and ConfigManager
jest.mock('@/utils/logger.js', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
const mockGetInstance = jest.fn();
const mockGet = jest.fn();
jest.mock('@/config/manager.js', () => ({
  ConfigManager: jest.fn().mockImplementation(() => ({
    getInstance: mockGetInstance,
    get: mockGet, 
  })),
}));
// Mock Model interface from the correct path
jest.mock('@/types/ai.js', () => { 
    const originalModule = jest.requireActual('@/types/ai.js');
    return {
        ...originalModule, 
        Model: jest.fn().mockImplementation(() => ({ 
            id: 'mock-model',
            generate: jest.fn(),
        })),
    };
});


import { ModelRegistry } from '@/ai/models/registry.js';
import { Model } from '@/types/ai.js'; // Import Model type
import { ConfigManager } from '@/config/manager.js';

// Helper to reset the singleton instance between tests
const resetModelRegistrySingleton = () => {
  (ModelRegistry as any).instance = undefined;
};

// Mock Model data for testing
const mockModel1: Model = { 
    id: 'test-model-1', 
    generate: jest.fn() 
} as jest.Mocked<Model>;

const mockModel2: Model = { 
    id: 'test-model-2', 
    generate: jest.fn() 
} as jest.Mocked<Model>;


describe('ModelRegistry', () => {
  let registry: ModelRegistry;
  let mockConfigManagerInstance: jest.Mocked<ConfigManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetModelRegistrySingleton();

    // Setup mock ConfigManager for getInstance
    mockConfigManagerInstance = {
        get: mockGet,
    } as unknown as jest.Mocked<ConfigManager>;
    mockGetInstance.mockReturnValue(mockConfigManagerInstance);
    
    // Default mock config: no providers, no default model
    mockGet.mockImplementation((key: string) => {
        if (key === 'ai.models.providers') return undefined;
        if (key === 'ai.defaultModel') return undefined;
        return undefined;
    });

    registry = ModelRegistry.getInstance();
  });

  it('should initialize with no models if none are configured', () => {
    // Constructor calls loadModelsFromConfig, which logs a warning if no providers
    expect(registry.listModelIds()).toEqual([]);
    expect(registry.getDefaultModel()).toBeUndefined();
  });

  it('should register and retrieve a model', () => {
    registry.registerModel(mockModel1);
    expect(registry.getModel('test-model-1')).toBe(mockModel1);
    expect(registry.listModelIds()).toEqual(['test-model-1']);
  });
  
  it('should return undefined for a non-existent model', () => {
     expect(registry.getModel('nonexistent')).toBeUndefined();
  });

  it('should overwrite a model if registered with the same ID', () => {
     const updatedModel1 = { ...mockModel1, generate: jest.fn() }; // Create a new object
     registry.registerModel(mockModel1);
     registry.registerModel(updatedModel1); // Register again
     expect(registry.getModel('test-model-1')).toBe(updatedModel1);
     expect(registry.listModelIds()).toHaveLength(1);
  });

  it('should list multiple registered model IDs', () => {
    registry.registerModel(mockModel1);
    registry.registerModel(mockModel2);
    const ids = registry.listModelIds();
    expect(ids).toHaveLength(2);
    expect(ids).toContain('test-model-1');
    expect(ids).toContain('test-model-2');
  });

  it('should get the default model from config if set and valid', () => {
     mockGet.mockImplementation((key: string) => {
        if (key === 'ai.defaultModel') return 'test-model-2'; // Set default in mock config
        return undefined;
    });
    // Need to re-initialize registry AFTER setting the mock implementation
    resetModelRegistrySingleton(); 
    registry = ModelRegistry.getInstance(); 
    
    registry.registerModel(mockModel1); 
    registry.registerModel(mockModel2); // Register the default model
    
    const defaultModel = registry.getDefaultModel();
    expect(defaultModel).toBeDefined();
    expect(defaultModel?.id).toBe('test-model-2');
  });
  
  it('should return undefined if default model in config is not found in registry', () => {
     mockGet.mockImplementation((key: string) => {
        if (key === 'ai.defaultModel') return 'nonexistent-model'; // Set invalid default
        return undefined;
    });
    resetModelRegistrySingleton();
    registry = ModelRegistry.getInstance(); 
    registry.registerModel(mockModel1);
    
    const defaultModel = registry.getDefaultModel();
    expect(defaultModel).toBeUndefined();
  });
  
  it('should fallback to first registered model if no default is set in config', () => {
     // No default set in config mock (default behavior of mock)
     resetModelRegistrySingleton();
     registry = ModelRegistry.getInstance(); 
     registry.registerModel(mockModel1);
     registry.registerModel(mockModel2);
     
     const defaultModel = registry.getDefaultModel();
     expect(defaultModel).toBeDefined();
     // The first registered model depends on Map iteration order
     expect(['test-model-1', 'test-model-2']).toContain(defaultModel?.id); 
  });
  
   it('should return undefined if no models are registered and no default is set', () => {
     // No default set, no models registered
     resetModelRegistrySingleton();
     registry = ModelRegistry.getInstance(); 
     const defaultModel = registry.getDefaultModel();
     expect(defaultModel).toBeUndefined();
  });
  
  // Test the constructor's loading logic (though limited without real providers)
  it('should attempt to load models from config during construction', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'ai.models.providers') return { 'mockProvider': { apiKey: '123' } }; // Simulate configured provider
        if (key === 'ai.defaultModel') return undefined;
        return undefined;
    });
    resetModelRegistrySingleton();
    registry = ModelRegistry.getInstance(); // Re-initialize with new mock config
    
    // Check logs or internal state if possible, or just that it doesn't crash
    // In this case, it should log a warning because the actual provider loading isn't implemented
    // We can't easily check the log mock here without more setup.
    // Just ensure registry is created.
    expect(registry).toBeInstanceOf(ModelRegistry);
    expect(registry.listModelIds()).toEqual([]); // No models actually registered by placeholder logic
  });

});
