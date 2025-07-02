// Mock agent module
class MockAgent {
  constructor(options = {}) {
    this.id = options.id || 'mock-agent';
    this.status = 'ready';
    this.capabilities = options.capabilities || [];
  }

  async initialize() {
    this.status = 'initialized';
    return Promise.resolve();
  }

  async execute(command, params = {}) {
    return Promise.resolve({
      success: true,
      result: `Mock execution of ${command}`,
      params
    });
  }

  async shutdown() {
    this.status = 'shutdown';
    return Promise.resolve();
  }

  getStatus() {
    return this.status;
  }

  getCapabilities() {
    return [...this.capabilities];
  }

  addCapability(capability) {
    if (!this.capabilities.includes(capability)) {
      this.capabilities.push(capability);
    }
  }

  removeCapability(capability) {
    const index = this.capabilities.indexOf(capability);
    if (index > -1) {
      this.capabilities.splice(index, 1);
    }
  }
}

module.exports = { Agent: MockAgent };
