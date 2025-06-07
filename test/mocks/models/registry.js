/**
 * Mock model registry for testing
 * Enhanced to match both ESM and CommonJS usage patterns
 */

class MockModel {
  constructor(id, options = {}) {
    // Support both direct ID and options object format
    if (typeof id === 'object') {
      options = id;
      id = options.id;
    }
    
    this.id = id;
    this.name = options.name || `Model ${id}`;
    this.provider = options.provider || 'test-provider';
    this.parameters = options.parameters || {};
    this.metadata = options.metadata || {};
    this.version = options.version || '1.0.0';
    this.capabilities = options.capabilities || ['text'];
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

  getCapabilities() {
    return this.capabilities;
  }
  
  // Add generate method to match Model interface
  generate = jest.fn().mockImplementation((input, options = {}) => {
    const inputText = typeof input === 'string' ? input : 
                     (input.prompt || input.text || JSON.stringify(input));
                     
    return Promise.resolve({
      content: `Generated content for ${inputText} using model ${this.id}`,
      usage: { total_tokens: 100, prompt_tokens: 50, completion_tokens: 50 }
    });
  });
  
  // Add execute method for compatibility
  execute = jest.fn().mockImplementation((input, options = {}) => {
    const inputValue = typeof input === 'string' ? input : 
                      (input.prompt || input.text || JSON.stringify(input));
                      
    return Promise.resolve({
      result: `Mock execution result for "${inputValue}" using model ${this.id}`,
      content: `Mock execution result for "${inputValue}" using model ${this.id}`,
      usage: {
        promptTokens: inputValue.length,
        completionTokens: 50,
        totalTokens: inputValue.length + 50
      }
    });
  });

  execute(input, options = {}) {
    const inputValue = typeof input === 'string' ? input : 
                      (input.prompt || input.text || JSON.stringify(input));
                      
    return Promise.resolve({
      result: `Mock execution result for "${inputValue}" using model ${this.id}`,
      content: `Mock execution result for "${inputValue}" using model ${this.id}`,
      usage: {
        promptTokens: inputValue.length,
        completionTokens: 50,
        totalTokens: inputValue.length + 50
      }
    });
  }
  
  async chat(messages, options = {}) {
    const lastMessage = Array.isArray(messages) && messages.length > 0 ? 
      messages[messages.length - 1].content : 'Empty message';
      
    return {
      content: `Mock chat response for "${lastMessage}" using model ${this.id}`,
      usage: {
        promptTokens: lastMessage.length,
        completionTokens: 50,
        totalTokens: lastMessage.length + 50
      }
    };
  }
}

class MockModelRegistry {
  constructor() {
    this.models = new Map();
    this.defaultModelId = null;
    this.providers = new Map();
  }

  static getInstance() {
    if (!MockModelRegistry.instance) {
      MockModelRegistry.instance = new MockModelRegistry();
      
      // Add some default models
      const defaultModels = [
        new MockModel('model-1', { name: 'Default Model', capabilities: ['text', 'chat'] }),
        new MockModel('model-2', { name: 'Advanced Model', capabilities: ['text', 'chat', 'vision'] })
      ];
      
      defaultModels.forEach(model => {
        MockModelRegistry.instance.registerModel(model);
      });
      
      MockModelRegistry.instance.defaultModelId = 'model-1';
    }
    
    return MockModelRegistry.instance;
  }

  registerModel(model) {
    if (!model) return;
    
    if (typeof model === 'object' && model.getId) {
      this.models.set(model.getId(), model);
      
      if (this.defaultModelId === null) {
        this.defaultModelId = model.getId();
      }
    } else if (typeof model === 'object' && model.id) {
      this.models.set(model.id, new MockModel(model.id, model));
      
      if (this.defaultModelId === null) {
        this.defaultModelId = model.id;
      }
    }
    
    return this;
  }

  getModel(id) {
    if (!id) {
      return this.getDefaultModel();
    }
    
    const model = this.models.get(id);
    
    if (!model) {
      if (id === 'default' && this.defaultModelId) {
        return this.getModel(this.defaultModelId);
      }
      console.warn(`Model with ID "${id}" not found in registry.`);
      return undefined;
    }
    
    return model;
  }

  getDefaultModel() {
    if (this.defaultModelId) {
      return this.getModel(this.defaultModelId);
    }
    return undefined;
  }

  getAllModels() {
    return Array.from(this.models.values());
  }

  setDefaultModel(id) {
    if (this.models.has(id)) {
      this.defaultModelId = id;
      return true;
    }
    return false;
  }
}

// Create singleton instance
const ModelRegistry = MockModelRegistry.getInstance();

// For ESM compatibility
export { 
  ModelRegistry,
  MockModelRegistry,
  MockModel
};

export const Model = MockModel; // For compatibility with imports expecting Model
export const Provider = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  TEST: 'test-provider'
};

// For CommonJS compatibility
module.exports = {
  ModelRegistry,
  MockModelRegistry,
  MockModel,
  Model: MockModel, // For compatibility with imports expecting Model
  Provider: {
    OPENAI: 'openai',
    ANTHROPIC: 'anthropic',
    TEST: 'test-provider'
  },
  // Default export for import default from syntax
  default: {
    ModelRegistry,
    MockModelRegistry,
    MockModel,
    Model: MockModel,
    Provider: {
      OPENAI: 'openai',
      ANTHROPIC: 'anthropic',
      TEST: 'test-provider'
    }
  }
};
