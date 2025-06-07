/**
 * Mock implementation of an IntegrationBridge for testing
 */
class MockBridge {
  constructor(options = {}) {
    this.id = options.id || 'mock-bridge';
    this.name = options.name || 'Mock Integration Bridge';
    this.source = options.source || 'current';
    this.target = options.target || 'goose';
    this.initialized = false;
    this.methodResponses = options.methodResponses || {};
    this.initializeSuccess = options.initializeSuccess !== false;
    this.initializeDelay = options.initializeDelay || 0;
    this.callDelay = options.callDelay || 0;
    
    // Track method calls for testing
    this.calls = [];
    
    // Optional error simulation
    this.simulateError = options.simulateError || false;
    this.errorMessage = options.errorMessage || 'Mock bridge error';
  }

  /**
   * Initialize the bridge
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    // Simulate initialization delay
    if (this.initializeDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.initializeDelay));
    }
    
    // Simulate error if configured
    if (this.simulateError) {
      throw new Error(this.errorMessage);
    }
    
    this.initialized = this.initializeSuccess;
    return this.initialized;
  }

  /**
   * Check if bridge is initialized
   * @returns {boolean} Initialization status
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Call a method on the bridge
   * @param {string} method - Method name
   * @param {any} args - Method arguments
   * @returns {Promise<any>} Method result
   */
  async call(method, args) {
    // Record the call for testing
    this.calls.push({ method, args });
    
    // Simulate call delay
    if (this.callDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.callDelay));
    }
    
    // Check if bridge is initialized
    if (!this.isInitialized()) {
      throw new Error(`Bridge ${this.id} not initialized`);
    }
    
    // Simulate error if configured
    if (this.simulateError) {
      throw new Error(this.errorMessage);
    }
    
    // Return mock response or default
    if (this.methodResponses[method]) {
      if (typeof this.methodResponses[method] === 'function') {
        return this.methodResponses[method](args);
      }
      return this.methodResponses[method];
    }
    
    // Default response is to echo the args
    return args;
  }
}

module.exports = { MockBridge };