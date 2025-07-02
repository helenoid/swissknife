/**
 * Mock implementation for Ink components and API
 * This provides complete functionality needed for ModelSelector tests
 */

// Create mock versions of Ink components with Jest spies
const Box = jest.fn(({ children }) => children || null);
const Text = jest.fn(({ children }) => children || '');
const Newline = jest.fn(() => '\n');

// Create useInput hook that can simulate key presses
const useInput = jest.fn((callback) => {
  // Store callback to allow test to trigger it
  if (typeof callback === 'function') {
    // Return a mock implementation that does nothing but can be spied on
    return jest.fn();
  }
  return jest.fn();
});

// Create a render function that returns an object with expected methods
const render = jest.fn(() => ({
  waitUntilExit: jest.fn().mockResolvedValue(undefined),
  clear: jest.fn(),
  unmount: jest.fn()
}));

// Export all components and hooks
module.exports = {
  Box,
  Text,
  useInput,
  Newline,
  render
};
