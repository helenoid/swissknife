// src/__mocks__/config/manager.ts

// Define a class that mimics the public interface of ConfigurationManager
class MockConfigurationManager {
  // Public instance methods, explicitly typed as Jest mocks
  initialize: jest.Mock = jest.fn();
  set: jest.Mock = jest.fn();
  get: jest.Mock = jest.fn();
  load: jest.Mock = jest.fn();
  save: jest.Mock = jest.fn();
  getDefaultConfig: jest.Mock = jest.fn();
  has: jest.Mock = jest.fn();
  delete: jest.Mock = jest.fn();
  listKeys: jest.Mock = jest.fn();
  registerSchema: jest.Mock = jest.fn();
  getAll: jest.Mock = jest.fn();
  reset: jest.Mock = jest.fn();

  // Static methods, explicitly typed as Jest mocks
  static getInstance: jest.Mock = jest.fn(() => new MockConfigurationManager());
  static resetInstance: jest.Mock = jest.fn();

  constructor() {
    // No-op constructor for the mock
  }
}

// Export the mocked class
export { MockConfigurationManager as ConfigurationManager };
