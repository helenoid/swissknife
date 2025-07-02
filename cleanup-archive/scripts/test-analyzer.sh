#!/bin/bash
# Simplified test analyzer for SwissKnife
# This script runs essential tests and helps diagnose issues

# Colors for terminal output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Test Analyzer${RESET}"
echo "Running essential tests to diagnose issues..."

# First, check one test that we know works
echo -e "${YELLOW}Verifying working test:${RESET}"
npx jest test/basic.test.js --config=jest-super-minimal.config.cjs

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Basic test passes - this is our reference point${RESET}"
else
  echo -e "${RED}✗ Even the basic test is failing - something is seriously wrong${RESET}"
  exit 1
fi

# Create a series of minimal tests to identify specific issues
mkdir -p test/diagnostic

# Test 1: Basic test - verifies Jest functionality
cat > test/diagnostic/01-basic.test.js << 'EOT'
/**
 * Basic test to verify Jest functionality
 */
test('simple addition', () => {
  expect(1 + 1).toBe(2);
});
EOT

# Test 2: Verify async/await functionality
cat > test/diagnostic/02-async.test.js << 'EOT'
/**
 * Test to verify async functionality
 */
test('async/await works', async () => {
  const result = await Promise.resolve('test');
  expect(result).toBe('test');
});
EOT

# Test 3: Verify describe blocks work
cat > test/diagnostic/03-describe.test.js << 'EOT'
/**
 * Test to verify describe blocks
 */
describe('Group of tests', () => {
  test('first test', () => {
    expect(true).toBeTruthy();
  });
  
  test('second test', () => {
    expect(false).toBeFalsy();
  });
});
EOT

# Test 4: Verify mocks work
cat > test/diagnostic/04-mocks.test.js << 'EOT'
/**
 * Test to verify mocking functionality
 */
test('mocks work', () => {
  const mockFn = jest.fn().mockReturnValue(42);
  expect(mockFn()).toBe(42);
  expect(mockFn).toHaveBeenCalled();
});
EOT

# Test 5: Verify EventEmitter works (for streams)
cat > test/diagnostic/05-events.test.js << 'EOT'
/**
 * Test to verify EventEmitter functionality
 */
test('EventEmitter works', done => {
  const { EventEmitter } = require('events');
  const emitter = new EventEmitter();
  
  emitter.on('test', data => {
    expect(data).toBe('test-data');
    done();
  });
  
  emitter.emit('test', 'test-data');
});
EOT

# Test 6: Verify module importing
cat > test/diagnostic/06-modules.test.js << 'EOT'
/**
 * Test to verify module importing
 */
test('can import core modules', () => {
  const path = require('path');
  const fs = require('fs');
  
  expect(typeof path.join).toBe('function');
  expect(typeof fs.readFileSync).toBe('function');
});
EOT

# Test 7: Create simplified ModelExecutionService test
cat > test/diagnostic/07-execution-service.test.js << 'EOT'
/**
 * Minimal ModelExecutionService test
 */
describe('ModelExecutionService', () => {
  // Create a simple mock
  const mockService = {
    executeModel: jest.fn().mockResolvedValue({
      response: 'mock response',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
    })
  };
  
  test('executeModel returns response', async () => {
    const result = await mockService.executeModel('test-model', 'test prompt');
    expect(result).toHaveProperty('response');
    expect(result).toHaveProperty('usage');
  });
});
EOT

# Test 8: Create simplified MCP Server test
cat > test/diagnostic/08-mcp-server.test.js << 'EOT'
/**
 * Minimal MCP Server test
 */
describe('MCP Server', () => {
  // Create a simple mock
  const mockServer = {
    start: jest.fn().mockResolvedValue({ port: 3000 }),
    stop: jest.fn().mockResolvedValue(true)
  };
  
  test('server starts and stops', async () => {
    const result = await mockServer.start();
    expect(result).toHaveProperty('port', 3000);
    
    await mockServer.stop();
    expect(mockServer.stop).toHaveBeenCalled();
  });
});
EOT

# Run all diagnostic tests
echo -e "${BLUE}Running diagnostic tests to identify issues:${RESET}"
for test_file in test/diagnostic/*.test.js; do
  echo -e "${YELLOW}Running ${test_file}:${RESET}"
  npx jest $test_file --config=jest-super-minimal.config.cjs
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Test passed: ${test_file}${RESET}"
  else
    echo -e "${RED}✗ Test failed: ${test_file}${RESET}"
  fi
  
  echo ""
done

# Now create a comprehensive test that combines all working patterns
echo -e "${BLUE}Creating comprehensive test combining all working patterns...${RESET}"
cat > test/diagnostic/comprehensive.test.js << 'EOT'
/**
 * Comprehensive test combining all working patterns
 * This test is based on patterns verified to work in the diagnostic tests
 */

// Basic imports
const { EventEmitter } = require('events');
const path = require('path');

// Basic test
test('basic assertion works', () => {
  expect(1 + 1).toBe(2);
});

// Async test
test('async/await works', async () => {
  const result = await Promise.resolve(42);
  expect(result).toBe(42);
});

// Test with EventEmitter (for streams)
test('event emitter works for streams', done => {
  const stream = new EventEmitter();
  const chunks = [];
  
  stream.on('data', chunk => chunks.push(chunk));
  stream.on('end', () => {
    expect(chunks).toEqual(['chunk1', 'chunk2']);
    done();
  });
  
  stream.emit('data', 'chunk1');
  stream.emit('data', 'chunk2');
  stream.emit('end');
});

// Mock tests
describe('Mocking functionality', () => {
  test('basic mocks work', () => {
    const mockFn = jest.fn().mockReturnValue('mocked');
    expect(mockFn()).toBe('mocked');
    expect(mockFn).toHaveBeenCalled();
  });
  
  test('mock implementations work', () => {
    const mockFn = jest.fn().mockImplementation(x => x * 2);
    expect(mockFn(21)).toBe(42);
  });
  
  test('async mocks work', async () => {
    const mockFn = jest.fn().mockResolvedValue('async result');
    const result = await mockFn();
    expect(result).toBe('async result');
  });
});

// ModelExecutionService mock
describe('ModelExecutionService', () => {
  // Simple mock implementation
  const mockService = {
    executeModel: jest.fn().mockImplementation(async (modelId, prompt) => ({
      response: `Response to "${prompt}" using ${modelId}`,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      timingMs: 100
    })),
    
    executeModelStream: jest.fn().mockImplementation(async () => {
      const stream = new EventEmitter();
      
      // Add required stream methods
      stream.pipe = jest.fn().mockReturnValue(stream);
      
      // Emit data in next tick
      process.nextTick(() => {
        stream.emit('data', { text: 'chunk1' });
        stream.emit('data', { text: 'chunk2' });
        stream.emit('end');
      });
      
      return stream;
    })
  };
  
  test('executeModel returns expected response', async () => {
    const result = await mockService.executeModel('test-model', 'Hello');
    expect(result).toHaveProperty('response');
    expect(result.response).toContain('Hello');
    expect(result).toHaveProperty('usage');
    expect(result).toHaveProperty('timingMs');
  });
  
  test('executeModelStream emits data events', async () => {
    const stream = await mockService.executeModelStream('test-model', 'Hello');
    const chunks = [];
    
    await new Promise((resolve, reject) => {
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveProperty('text', 'chunk1');
    expect(chunks[1]).toHaveProperty('text', 'chunk2');
  });
});

// MCP Server mock
describe('MCP Server', () => {
  const mockServer = {
    start: jest.fn().mockResolvedValue({ port: 3000 }),
    stop: jest.fn().mockResolvedValue(true),
    registerTool: jest.fn()
  };
  
  test('server starts and stops', async () => {
    const result = await mockServer.start();
    expect(result).toHaveProperty('port', 3000);
    
    await mockServer.stop();
    expect(mockServer.stop).toHaveBeenCalled();
  });
  
  test('server can register tools', () => {
    mockServer.registerTool('test-tool', {
      name: 'test-tool',
      description: 'A test tool',
      execute: async () => ({ result: 'test result' })
    });
    
    expect(mockServer.registerTool).toHaveBeenCalled();
  });
});
EOT

# Run the comprehensive test
echo -e "${BLUE}Running comprehensive test:${RESET}"
npx jest test/diagnostic/comprehensive.test.js --config=jest-super-minimal.config.cjs

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Comprehensive test passed${RESET}"
  echo -e "${GREEN}All necessary test patterns are working!${RESET}"
else
  echo -e "${RED}✗ Comprehensive test failed${RESET}"
  echo -e "${RED}Need to investigate which patterns are failing${RESET}"
fi

# Update our mock implementations to reflect working patterns
echo -e "${BLUE}Updating mock implementations based on working patterns...${RESET}"

mkdir -p test/diagnostic/mocks

cat > test/diagnostic/mocks/ModelExecutionService.js << 'EOT'
/**
 * Working mock implementation of ModelExecutionService
 * Based on patterns verified to work in diagnostic tests
 */
const { EventEmitter } = require('events');

class ModelExecutionService {
  static #instance;
  
  static getInstance() {
    if (!this.#instance) {
      this.#instance = new ModelExecutionService();
    }
    return this.#instance;
  }
  
  static resetInstance() {
    this.#instance = null;
  }
  
  async executeModel(modelId, prompt, options = {}) {
    return {
      response: `Mock response for "${prompt}" using model ${modelId}`,
      usage: { 
        promptTokens: Math.floor(prompt.length / 4), 
        completionTokens: 20, 
        totalTokens: Math.floor(prompt.length / 4) + 20 
      },
      timingMs: 100
    };
  }
  
  async executeModelStream(modelId, prompt, options = {}) {
    const stream = new EventEmitter();
    
    // Simulate streaming data
    process.nextTick(() => {
      stream.emit('data', { text: 'Hello' });
      stream.emit('data', { text: ' world' });
      stream.emit('end');
    });
    
    // Add required stream methods
    stream.pipe = function(dest) {
      this.on('data', (chunk) => dest.write(chunk));
      this.on('end', () => dest.end());
      return dest;
    };
    
    return stream;
  }
  
  getModelsByCapability(capability) {
    return [
      { id: 'model-1', capabilities: { [capability]: true } },
      { id: 'model-2', capabilities: { [capability]: true } }
    ];
  }
  
  getDefaultModel() {
    return {
      id: 'default-model',
      provider: 'mock-provider',
      capabilities: { streaming: true }
    };
  }
}

// Export for both ESM and CommonJS
if (typeof module !== 'undefined') {
  module.exports = { ModelExecutionService };
}
EOT

echo -e "${GREEN}Test analyzer complete${RESET}"
echo "Use the comprehensive test as a template for fixing other tests"
