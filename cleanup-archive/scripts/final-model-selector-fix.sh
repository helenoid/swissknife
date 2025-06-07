#!/bin/bash
# Final ModelSelector Test Fixer
# This script fixes all issues with the ModelSelector test

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Final ModelSelector Test Fix =====${NC}"

# Step 1: Create a better mock implementation for Ink
INK_MOCK="/home/barberb/swissknife/test/mocks/stubs/ink-mock.js"
mkdir -p "$(dirname "$INK_MOCK")"

echo -e "${YELLOW}Creating enhanced Ink mock implementation...${NC}"

echo "/**
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
};" > "$INK_MOCK"

echo -e "${GREEN}Created enhanced Ink mock!${NC}"

# Step 2: Create a better mock for React hooks
REACT_MOCK="/home/barberb/swissknife/test/mocks/stubs/react-mock.js"

echo -e "${YELLOW}Creating enhanced React mock implementation...${NC}"

echo "/**
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
};" > "$REACT_MOCK"

echo -e "${GREEN}Created enhanced React mock!${NC}"

# Step 3: Fix the test file
MODEL_SELECTOR_TEST="/home/barberb/swissknife/test/model_selector.test.tsx"
echo -e "${YELLOW}Fixing ModelSelector test...${NC}"

# Check if file exists
if [ ! -f "$MODEL_SELECTOR_TEST" ]; then
  echo -e "${RED}ModelSelector test file not found!${NC}"
  exit 1
fi

# Fix 1: Update React mock
sed -i '/jest.mock('\''react'\''/,/});/ c\\
// Mock React hooks with enhanced implementation\\
jest.mock('\''react'\'', () => require('\''./mocks/stubs/react-mock.js'\''));' "$MODEL_SELECTOR_TEST"

# Fix 2: Update Ink mock
sed -i '/jest.mock('\''ink'\''/,/});/ c\\
// Mock Ink components with enhanced implementation\\
jest.mock('\''ink'\'', () => require('\''./mocks/stubs/ink-mock.js'\''));' "$MODEL_SELECTOR_TEST"

# Fix 3: Add jest.useFakeTimers() at the beginning of describe block
sed -i '/describe('\''ModelSelector Component'\''/a\\
  \\
  // Use fake timers for testing\\
  beforeAll(() => {\\
    jest.useFakeTimers();\\
  });\\
\\
  afterAll(() => {\\
    jest.useRealTimers();\\
  });' "$MODEL_SELECTOR_TEST"

echo -e "${GREEN}Fixed ModelSelector test!${NC}"

# Step 4: Run the test to verify
echo -e "${YELLOW}Running test to verify fix...${NC}"
npx jest --config=jest.unified.config.cjs "$MODEL_SELECTOR_TEST" --no-cache

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Success! ModelSelector test now passes.${NC}"
else
  echo -e "${RED}Failed. ModelSelector test still has issues.${NC}"
fi
