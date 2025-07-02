#!/bin/bash
# Script to fix the ModelSelector test issues
# This script fixes import paths and mocks in ModelSelector test

# Basic setup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== Fixing ModelSelector Test (Extended) =====${NC}"

# Fix for ModelSelector.test.tsx
MODEL_SELECTOR_TEST="./test/model_selector.test.tsx"
if [ -f "$MODEL_SELECTOR_TEST" ]; then
  echo "Fixing ModelSelector test imports and mocks"
  
  # Ensure ink is properly mocked by adding a better mock implementation
  sed -i '/jest.mock('\''ink'\''/,/});/c\
// Mock Ink components with better implementation\
jest.mock('\''ink'\'', () => ({\
  Box: jest.fn(({ children }) => children),\
  Text: jest.fn(({ children }) => children),\
  useInput: jest.fn((callback) => callback),\
  Newline: jest.fn(() => null),\
  render: jest.fn((element) => ({\
    waitUntilExit: jest.fn().mockResolvedValue(undefined),\
    clear: jest.fn(),\
    unmount: jest.fn()\
  }))\
}));' "$MODEL_SELECTOR_TEST"

  # Improve the React mock to handle useState better
  sed -i '/jest.mock('\''react'\''/,/});/c\
// Mock React hooks with better implementation\
jest.mock('\''react'\'', () => {\
  const originalReact = jest.requireActual('\''react'\'');\
  const mockStates = new Map();\
  let stateCounter = 0;\
  \
  const mockUseState = jest.fn((initialValue) => {\
    const id = stateCounter++;\
    if (!mockStates.has(id)) {\
      mockStates.set(id, initialValue);\
    }\
    const setState = jest.fn((newValue) => {\
      if (typeof newValue === '\''function'\'') {\
        mockStates.set(id, newValue(mockStates.get(id)));\
      } else {\
        mockStates.set(id, newValue);\
      }\
    });\
    return [mockStates.get(id), setState];\
  });\
  \
  return {\
    ...originalReact,\
    useState: mockUseState,\
    useEffect: jest.fn((fn) => fn()),\
    useCallback: jest.fn((fn) => fn),\
    useRef: jest.fn((initialValue) => ({ current: initialValue })),\
  };\
});' "$MODEL_SELECTOR_TEST"

  # Fix the Custom Select mock  
  sed -i '/jest.mock('\''..\/src\/components\/CustomSelect\/select.js/,/});/c\
// Mock custom components\
jest.mock('\''../src/components/CustomSelect/select.js'\'', () => ({\
  Select: jest.fn(({ items, onSelect }) => {\
    // Simulate selecting the first item\
    if (items && items.length > 0 && typeof onSelect === '\''function'\'') {\
      setTimeout(() => onSelect(items[0]), 0);\
    }\
    return null;\
  }),\
}));' "$MODEL_SELECTOR_TEST"

  # Add setup for better mocking of imported modules
  if ! grep -q "// Test initialization" "$MODEL_SELECTOR_TEST"; then
    LINE_NUM=$(grep -n "describe('ModelSelector Component" "$MODEL_SELECTOR_TEST" | cut -d':' -f1)
    if [ -n "$LINE_NUM" ]; then
      sed -i "${LINE_NUM}i\\
// Test initialization\\
jest.useFakeTimers();\\
" "$MODEL_SELECTOR_TEST"
    fi
  fi
  
  echo -e "${GREEN}Fixed ModelSelector test successfully${NC}"
else
  echo -e "${RED}Could not find ModelSelector test file${NC}"
fi

# Make sure dependencies are installed
if [ ! -d "node_modules/ink" ] || [ ! -d "node_modules/react" ]; then
  echo -e "${YELLOW}Installing required dependencies for tests...${NC}"
  npm install --no-save ink react jest-environment-jsdom @testing-library/react
fi

echo -e "${GREEN}ModelSelector test fixes applied successfully!${NC}"
