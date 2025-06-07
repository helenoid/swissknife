/**
 * Unified Mock Implementations for SwissKnife Tests
 * Compatible with both ESM and CommonJS
 */

// No need to detect environment for imports, just use CommonJS
// which works in both Jest environments with proper configuration
const { EventEmitter } = require('events');

/**
 * Create a mock stream compatible with both ESM and CommonJS
 */
function createMockStream(chunks = [], delay = 10, error = null) {
  const stream = new EventEmitter();
  
  // Add stream-like methods
  stream.pipe = function() { return this; };
  stream.on = function(event, handler) { 
    this.addListener(event, handler); 
    return this; 
  };
  stream.once = function(event, handler) {
    const onceHandler = (...args) => {
      this.removeListener(event, onceHandler);
      handler.apply(this, args);
    };
    this.on(event, onceHandler);
    return this;
  };
  stream.removeListener = function() { return this; };
  stream.removeAllListeners = function() { return this; };
  
  // Simulate async emission of events
  setTimeout(() => {
    if (chunks && chunks.length > 0) {
      chunks.forEach((chunk, index) => {
        setTimeout(() => {
          stream.emit('data', chunk);
        }, index * delay);
      });
      
      setTimeout(() => {
        if (error) {
          stream.emit('error', error);
        }
        stream.emit('end');
      }, chunks.length * delay + 5);
    } else {
      if (error) {
        stream.emit('error', error);
      }
      stream.emit('end');
    }
  }, 5);
  
  return stream;
}

/**
 * Mock ModelExecutionService
 */
const MockModelExecutionService = {
  executeModel: async function(modelId, prompt, options = {}) {
    return {
      response: `Mock response for ${modelId}: ${prompt}`,
      usage: {
        promptTokens: Math.ceil(prompt.length / 4),
        completionTokens: 100,
        totalTokens: Math.ceil(prompt.length / 4) + 100
      },
      timingMs: 50
    };
  },
  
  executeModelStream: async function(modelId, prompt, options = {}) {
    return createMockStream([
      { text: 'This ' },
      { text: 'is ' },
      { text: 'a ' },
      { text: 'mock ' },
      { text: 'response.' }
    ]);
  },
  
  getModelsByCapability: async function(capability) {
    return [{ id: 'mock-model', capabilities: { [capability]: true } }];
  },
  
  getDefaultModel: async function() {
    return { id: 'default-model', name: 'Default Model' };
  }
};

/**
 * Mock MCP Server
 */
const MockMCPServer = {
  start: async function() {
    return { port: 3000 };
  },
  
  stop: async function() {
    return true;
  },
  
  registerTool: async function() {
    return true;
  },
  
  callTool: async function(request) {
    if (request?.name === 'bash' && 
        request?.arguments?.command && 
        request.arguments.command.includes('sleep')) {
      throw new Error('Command timed out');
    }
    return { result: `Mock result for tool: ${request?.name || 'unknown'}` };
  }
};

// Export for both ESM and CommonJS
const exportObj = {
  createMockStream,
  MockModelExecutionService,
  MockMCPServer
};

// CommonJS export (this will work in both environments)
module.exports = exportObj;
