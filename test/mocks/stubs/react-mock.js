/**
 * Mock implementation for React hooks
 * This provides better functionality for ModelSelector tests
 */

// Import actual React
const originalReact = jest.requireActual('react');

// Store state in a way that allows us to update it
const mockStates = new Map();
let stateCounter = 0;

// Create a useState implementation that actually stores state
const mockUseState = jest.fn((initialValue) => {
  const id = stateCounter++;
  if (!mockStates.has(id)) {
    mockStates.set(id, initialValue);
  }
  
  const setState = jest.fn((newValue) => {
    if (typeof newValue === 'function') {
      mockStates.set(id, newValue(mockStates.get(id)));
    } else {
      mockStates.set(id, newValue);
    }
  });
  
  return [mockStates.get(id), setState];
});

// Create useEffect that actually runs the effect
const mockUseEffect = jest.fn((fn, deps) => {
  // Run the effect function
  return fn();
});

// Create useCallback that wraps the callback
const mockUseCallback = jest.fn((fn, deps) => {
  return fn;
});

// Create useRef that actually stores a value
const mockUseRef = jest.fn((initialValue) => {
  return { current: initialValue };
});

// Reset state counter for testing
const resetMocks = () => {
  mockStates.clear();
  stateCounter = 0;
};

// Export mock implementations
module.exports = {
  ...originalReact,
  useState: mockUseState,
  useEffect: mockUseEffect,
  useCallback: mockUseCallback,
  useRef: mockUseRef,
  _resetMocks: resetMocks // internal utility for testing
};
