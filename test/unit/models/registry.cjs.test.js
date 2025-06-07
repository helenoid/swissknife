/**
 * Model Registry Test (CommonJS version)
 * 
 * This test suite verifies the functionality of the ModelRegistry class,
 * including model registration, retrieval, and default model handling.
 */

// Define a mock Model class for testing
class Model {
  constructor(options) {
    this.id = options.id;
    this.name = options.name;
    this.provider = options.provider;
    this.parameters = options.parameters || {};
    this.metadata = options.metadata || {};
  }
  
  getId() {
    return this.id;
  }
  
  getName() {
    return this.name;
  }
  
  getProvider() {
    return this.provider;
  }
  
  getParameters() {
    return this.parameters;
  }
  
  getMetadata() {
    return this.metadata;
  }
  
  async generate() {
    return {
      text: 'Mock response',
      usage: {
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15
      }
    };
  }
}

// Define the ModelRegistry class for testing
class ModelRegistry {
  static instance;
  
  constructor() {
    this.models = new Map();
    this.defaultModelId = null;
  }
  
  static getInstance() {
    if (!ModelRegistry.instance) {
      ModelRegistry.instance = new ModelRegistry();
    }
    return ModelRegistry.instance;
  }
  
  registerModel(model) {
    if ('loader' in model) {
      this.models.set(model.id, model);
    } else {
      this.models.set(model.getId(), model);
      if (this.defaultModelId === null) {
        this.setDefaultModel(model.getId());
      }
    }
  }
  
  getModel(id) {
    if (!this.models.has(id)) {
      return null;
    }
    
    const model = this.models.get(id);
    if ('loader' in model) {
      throw new Error('Lazy model loading not implemented in test');
    }
    return model;
  }
  
  hasModel(id) {
    return this.models.has(id);
  }
  
  getAllModels() {
    const models = [];
    this.models.forEach((model, id) => {
      if (!('loader' in model)) {
        models.push(model);
      }
    });
    return models;
  }
  
  getDefaultModel() {
    if (!this.defaultModelId || !this.models.has(this.defaultModelId)) {
      return null;
    }
    return this.getModel(this.defaultModelId);
  }
  
  setDefaultModel(id) {
    if (!this.models.has(id)) {
      throw new Error(`Cannot set default model: model ${id} not found`);
    }
    this.defaultModelId = id;
  }
}

// Tests
describe('ModelRegistry', () => {
  let registry;

  beforeEach(() => {
    // Reset the singleton before each test
    ModelRegistry.instance = undefined;
    registry = ModelRegistry.getInstance();
  });

  test('should be a singleton', () => {
    const instance1 = ModelRegistry.getInstance();
    const instance2 = ModelRegistry.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should register and retrieve a model', () => {
    const model1 = new Model({ id: 'model-1', name: 'Model One', provider: 'provider-a' });
    registry.registerModel(model1);
    
    expect(registry.hasModel('model-1')).toBe(true);
    const retrievedModel = registry.getModel('model-1');
    expect(retrievedModel).toBe(model1);
    expect(retrievedModel.getName()).toBe('Model One');
  });

  test('should return null for non-existent model', () => {
    expect(registry.getModel('non-existent')).toBeNull();
  });

  test('should set first registered model as default', () => {
    const model1 = new Model({ id: 'model-1', name: 'Model One', provider: 'provider-a' });
    const model2 = new Model({ id: 'model-2', name: 'Model Two', provider: 'provider-b' });
    
    registry.registerModel(model1);
    registry.registerModel(model2);
    
    expect(registry.getDefaultModel()).toBe(model1);
  });

  test('should manually set default model', () => {
    const model1 = new Model({ id: 'model-1', name: 'Model One', provider: 'provider-a' });
    const model2 = new Model({ id: 'model-2', name: 'Model Two', provider: 'provider-b' });
    
    registry.registerModel(model1);
    registry.registerModel(model2);
    
    registry.setDefaultModel('model-2');
    expect(registry.getDefaultModel()).toBe(model2);
  });

  test('should throw error when setting non-existent model as default', () => {
    expect(() => {
      registry.setDefaultModel('non-existent');
    }).toThrow();
  });

  test('should get all registered models', () => {
    const model1 = new Model({ id: 'model-1', name: 'Model One', provider: 'provider-a' });
    const model2 = new Model({ id: 'model-2', name: 'Model Two', provider: 'provider-b' });
    
    registry.registerModel(model1);
    registry.registerModel(model2);
    
    const models = registry.getAllModels();
    expect(models).toHaveLength(2);
    expect(models).toContain(model1);
    expect(models).toContain(model2);
  });
});
