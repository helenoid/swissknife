// src/__mocks__/command-registry.ts

// Define a class that mimics the public interface of CommandRegistry
class MockCommandRegistry {
  // Public instance methods, explicitly typed as Jest mocks
  register: jest.Mock = jest.fn();
  getCommand: jest.Mock = jest.fn();
  listCommandNames: jest.Mock = jest.fn();
  listCommands: jest.Mock = jest.fn();

  // If the original CommandRegistry has a public 'commands' property, mock it here.
  // If it's private, it should not be directly mocked in the public interface.
  // Assuming 'commands' is a private property that is not directly accessed by tests,
  // its behavior should be controlled via `register` and `getCommand` mocks.
  // If it's a public property, uncomment and type it:
  // commands: Map<string, any> = new Map();

  constructor() {
    // No-op constructor for the mock
  }
}

// Mock the CommandRegistry class itself
const MockedCommandRegistry = jest.fn(() => new MockCommandRegistry());

// If CommandRegistry has static methods, mock them here.
// Example: MockedCommandRegistry.someStaticMethod = jest.fn();

// Export the mocked class
export { MockedCommandRegistry as CommandRegistry };
