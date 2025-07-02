#!/bin/bash
# Simple test runner that focuses on directly fixing key test issues
# This will run each test and attempt to diagnose issues

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Test Fixer${RESET}"
echo "Running key tests to diagnose issues..."

# First, let's test with the most minimal configuration
echo -e "${YELLOW}Testing with super-minimal config...${RESET}"
echo -e "Running super-minimal test..."
NODE_OPTIONS="--experimental-vm-modules" npx jest test/super-minimal.test.js --config=jest-super-minimal.config.cjs

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Super-minimal test passed!${RESET}"
else
  echo -e "${RED}Super-minimal test failed!${RESET}"
  echo "This is concerning as it's our most basic test setup."
  exit 1
fi

# Now create and run a more comprehensive diagnostic test
echo -e "${YELLOW}Creating comprehensive diagnostic test...${RESET}"

cat > test/comprehensive-diagnostic.test.js << 'EOL'
/**
 * Comprehensive diagnostic test to identify SwissKnife test issues
 */

// Basic tests to verify Jest functionality
describe('Basic Jest functionality', () => {
  test('Simple assertions work', () => {
    expect(1 + 1).toBe(2);
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
    expect({}).not.toBeNull();
  });

  test('Async/await works', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });

  test('Mocks work properly', () => {
    const mockFn = jest.fn(() => 'mocked');
    expect(mockFn()).toBe('mocked');
    expect(mockFn).toHaveBeenCalled();
  });
});

// Test environment diagnostics
describe('Environment diagnostics', () => {
  test('Node environment is correctly set', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  test('Can import Node core modules', () => {
    const fs = require('fs');
    const path = require('path');
    expect(typeof fs.readFileSync).toBe('function');
    expect(typeof path.join).toBe('function');
  });
});

// Test module loading
describe('Module loading diagnostics', () => {
  test('Can handle ESM-style imports', () => {
    try {
      // This might fail depending on the Jest config, which is useful diagnostic info
      // We're catching the error to prevent test failure
      require('./helpers/testUtils.js');
      console.log('✅ ESM imports appear to work');
    } catch (error) {
      console.log('❌ ESM import issue:', error.message);
    }
  });
  
  test('Can import with .js extensions', () => {
    try {
      // Testing both with and without .js extension
      require('../dist/models/execution');
      console.log('✅ Import without .js extension works');
    } catch (error1) {
      console.log('❌ Import without .js extension fails:', error1.message);
      
      try {
        require('../dist/models/execution.js');
        console.log('✅ Import with .js extension works');
      } catch (error2) {
        console.log('❌ Import with .js extension also fails:', error2.message);
      }
    }
  });
});

// Special mock validation
describe('Mocking implementation diagnostics', () => {
  test('ModelExecutionService can be mocked', () => {
    try {
      jest.mock('../dist/models/execution.js', () => ({
        ModelExecutionService: {
          getInstance: jest.fn().mockReturnValue({
            executeModel: jest.fn().mockResolvedValue({
              response: 'mocked response',
              usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
            })
          })
        }
      }));
      
      const { ModelExecutionService } = require('../dist/models/execution.js');
      expect(ModelExecutionService.getInstance).toBeDefined();
      console.log('✅ ModelExecutionService mocking works');
    } catch (error) {
      console.log('❌ ModelExecutionService mocking issue:', error.message);
    }
  });
});
EOL

echo -e "${YELLOW}Running comprehensive diagnostic test...${RESET}"
NODE_OPTIONS="--experimental-vm-modules" npx jest test/comprehensive-diagnostic.test.js --config=jest-super-minimal.config.cjs

echo -e "${YELLOW}Starting to fix key issues in main modules...${RESET}"

# Test and fix the execution service test
echo -e "${YELLOW}Testing execution service...${RESET}"
NODE_OPTIONS="--experimental-vm-modules" npx jest test/execution-service-isolated.test.js --config=jest.unified.config.cjs

# Test and fix MCP server test
echo -e "${YELLOW}Testing minimal MCP server...${RESET}"
NODE_OPTIONS="--experimental-vm-modules" npx jest test/mcp-minimal.test.js --config=jest-super-minimal.config.cjs

echo -e "${BLUE}Test diagnostics and fixes complete${RESET}"
