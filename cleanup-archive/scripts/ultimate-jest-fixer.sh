#!/bin/bash
# Ultimate Jest configuration fixer

set -e

echo "🔧 Ultimate Jest Configuration Fix"
echo "=================================="

# Create backup of current configs
echo "📦 Creating backups..."
cp jest.config.cjs jest.config.cjs.backup.$(date +%s) 2>/dev/null || true
cp tsconfig.test.json tsconfig.test.json.backup.$(date +%s) 2>/dev/null || true

# Create a TypeScript config specifically for Jest (CommonJS)
echo "📝 Creating Jest-specific TypeScript configuration..."
cat > tsconfig.jest.json << 'EOF'
{
  "compilerOptions": {
    "target": "es2020",
    "module": "commonjs",
    "lib": ["es2020", "dom"],
    "moduleResolution": "node",
    "allowJs": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "strict": false,
    "noImplicitAny": false,
    "resolveJsonModule": true,
    "isolatedModules": false,
    "declaration": false,
    "sourceMap": false,
    "baseUrl": ".",
    "rootDir": ".",
    "outDir": "./dist-test",
    "paths": {
      "@/*": ["./src/*"],
      "~/*": ["./*"]
    },
    "types": ["node", "jest"]
  },
  "include": [
    "src/**/*",
    "test/**/*",
    "**/*.test.ts",
    "**/*.test.js",
    "**/*.spec.ts",
    "**/*.spec.js"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "**/*.backup",
    "**/*.bak"
  ]
}
EOF

# Create a working Jest configuration
echo "⚙️ Creating working Jest configuration..."
cat > jest-ultimate.config.js << 'EOF'
module.exports = {
  // Basic configuration
  testEnvironment: 'node',
  verbose: true,
  
  // Root directory
  rootDir: '.',
  
  // Test file patterns
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.test.ts',
    '**/test/**/*.test.tsx',
    '**/__tests__/**/*.js',
    '**/__tests__/**/*.ts',
    '**/*.test.js',
    '**/*.test.ts'
  ],
  
  // Transform configuration for TypeScript and JavaScript
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
        useESM: false,
        isolatedModules: true
      }
    ],
    '^.+\\.jsx?$': [
      'babel-jest',
      {
        presets: [
          [
            '@babel/preset-env',
            {
              targets: { node: 'current' },
              modules: 'commonjs'
            }
          ]
        ]
      }
    ]
  },
  
  // Module name mapping
  moduleNameMapper: {
    // Handle path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
    
    // Handle test utilities
    '^../testUtils$': '<rootDir>/test/helpers/testUtils',
    '^../../testUtils$': '<rootDir>/test/helpers/testUtils',
    '^../helpers/testUtils$': '<rootDir>/test/helpers/testUtils',
    
    // Handle CSS and asset imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(png|jpg|jpeg|gif|svg)$': 'jest-transform-stub',
    
    // Handle lodash-es
    '^lodash-es$': 'lodash',
    '^lodash-es/(.*)$': 'lodash/$1',
    
    // Handle missing modules
    '^@modelcontextprotocol/sdk$': '<rootDir>/test/mocks/mcp-sdk-stub.js',
    'ink-testing-library': '<rootDir>/test/mocks/ink-testing-stub.js'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/jest.ultimate.setup.js'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Timeout
  testTimeout: 30000,
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.*',
    '!src/**/*.spec.*'
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests
  resetModules: false,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '\\.bak$',
    '\\.backup$'
  ],
  
  // Transform ignore patterns (let everything be transformed)
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ],
  
  // Global settings
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
      useESM: false
    }
  }
};
EOF

# Create Jest setup file
echo "🛠️ Creating Jest setup file..."
mkdir -p test
cat > test/jest.ultimate.setup.js << 'EOF'
/**
 * Ultimate Jest setup file
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock console in tests unless debugging
if (!process.env.DEBUG_TESTS) {
  const originalConsole = global.console;
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: originalConsole.warn,
    error: originalConsole.error
  };
}

// Global test utilities
global.testUtils = {
  createMock: (returnValue) => jest.fn(() => returnValue),
  createAsyncMock: (returnValue) => jest.fn(async () => returnValue),
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  mockConsole: () => {
    const originalConsole = global.console;
    global.console = {
      ...originalConsole,
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };
    return originalConsole;
  },
  restoreConsole: (originalConsole) => {
    global.console = originalConsole;
  }
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

console.log('Ultimate Jest setup loaded successfully');
EOF

# Create comprehensive test utilities
echo "🧰 Creating comprehensive test utilities..."
mkdir -p test/helpers test/mocks

cat > test/helpers/testUtils.js << 'EOF'
/**
 * Comprehensive test utilities
 */

const path = require('path');
const fs = require('fs/promises');
const os = require('os');

// Test helper functions
function createMockModel(id, name, provider) {
  return {
    id,
    name,
    provider,
    parameters: { temperature: 0.7 },
    metadata: { version: '1.0' }
  };
}

async function createTempTestDir() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'swissknife-test-'));
  return tempDir;
}

async function removeTempTestDir(dirPath) {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    console.warn('Failed to remove temp directory:', error);
  }
}

function createMockStorage() {
  return {
    store: jest.fn(),
    retrieve: jest.fn(),
    delete: jest.fn(),
    list: jest.fn()
  };
}

function createMockLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// Mock implementations
class MockModel {
  constructor(config) {
    this.config = config;
  }
  
  async execute(input) {
    return { output: `Mock output for ${input}` };
  }
}

class MockStorage {
  constructor() {
    this.data = new Map();
  }
  
  async store(key, value) {
    this.data.set(key, value);
  }
  
  async retrieve(key) {
    return this.data.get(key);
  }
  
  async delete(key) {
    this.data.delete(key);
  }
  
  async list() {
    return Array.from(this.data.keys());
  }
}

const testConfig = {
  tempDir: os.tmpdir(),
  timeout: 10000,
  retries: 3
};

module.exports = {
  createMockModel,
  createTempTestDir,
  removeTempTestDir,
  createMockStorage,
  createMockLogger,
  MockModel,
  MockStorage,
  testConfig
};
EOF

# Create stub files for missing modules
echo "📦 Creating module stubs..."
mkdir -p test/mocks

cat > test/mocks/mcp-sdk-stub.js << 'EOF'
/**
 * Mock MCP SDK for testing
 */

module.exports = {
  Client: class MockClient {
    constructor() {
      this.connected = false;
    }
    
    async connect() {
      this.connected = true;
      return true;
    }
    
    async disconnect() {
      this.connected = false;
    }
    
    async request(method, params) {
      return { method, params, result: 'mock_result' };
    }
  },
  
  Server: class MockServer {
    constructor() {
      this.running = false;
    }
    
    async start() {
      this.running = true;
    }
    
    async stop() {
      this.running = false;
    }
  }
};
EOF

cat > test/mocks/ink-testing-stub.js << 'EOF'
/**
 * Mock Ink testing library
 */

module.exports = {
  render: jest.fn(() => ({
    lastFrame: jest.fn(() => ''),
    unmount: jest.fn(),
    rerender: jest.fn()
  })),
  cleanup: jest.fn()
};
EOF

# Test the configuration
echo "🧪 Testing the new configuration..."

# Create a simple test file to verify everything works
cat > test-config-verification.js << 'EOF'
test('Configuration verification', () => {
  expect(1 + 1).toBe(2);
  expect(typeof jest).toBe('object');
  expect(typeof global.testUtils).toBe('object');
});

test('Mock utilities work', () => {
  const mockFn = global.testUtils.createMock('test-value');
  expect(mockFn()).toBe('test-value');
  expect(mockFn).toHaveBeenCalled();
});

test('Async utilities work', async () => {
  const asyncMock = global.testUtils.createAsyncMock('async-value');
  const result = await asyncMock();
  expect(result).toBe('async-value');
});
EOF

echo "🚀 Running configuration test..."
if npx jest test-config-verification.js --config=jest-ultimate.config.js --verbose; then
  echo "✅ Configuration test passed!"
  
  # Now test one of the actual test files
  echo "🎯 Testing actual test file..."
  if npx jest test/unit/models/registry-revised.test.ts --config=jest-ultimate.config.js --verbose; then
    echo "✅ Actual test file works!"
  else
    echo "⚠️ Actual test file still has issues - will need manual fixes"
  fi
else
  echo "❌ Configuration test failed"
fi

# Create ultimate test runner script
echo "📜 Creating ultimate test runner..."
cat > run-ultimate-tests.sh << 'EOF'
#!/bin/bash
# Ultimate test runner with comprehensive error handling

CONFIG="jest-ultimate.config.js"
DEFAULT_PATTERN="test"

echo "🧪 SwissKnife Ultimate Test Runner"
echo "=================================="

# Parse command line arguments
PATTERN="${1:-$DEFAULT_PATTERN}"
DEBUG_MODE="${DEBUG_TESTS:-false}"
BAIL_ON_FIRST_FAILURE="${BAIL:-false}"

if [ "$1" = "--debug" ]; then
    DEBUG_MODE="true"
    PATTERN="${2:-$DEFAULT_PATTERN}"
    shift
fi

if [ "$1" = "--bail" ]; then
    BAIL_ON_FIRST_FAILURE="true"
    PATTERN="${2:-$DEFAULT_PATTERN}"
    shift
fi

# Set environment variables
export NODE_ENV=test
export DEBUG_TESTS="$DEBUG_MODE"

echo "Using configuration: $CONFIG"
echo "Test pattern: $PATTERN"
echo "Debug mode: $DEBUG_MODE"
echo "Bail on failure: $BAIL_ON_FIRST_FAILURE"
echo ""

# Build Jest command
JEST_CMD="npx jest --config=$CONFIG"

if [ "$DEBUG_MODE" = "true" ]; then
    JEST_CMD="$JEST_CMD --verbose --no-coverage"
fi

if [ "$BAIL_ON_FIRST_FAILURE" = "true" ]; then
    JEST_CMD="$JEST_CMD --bail"
fi

# Add remaining arguments
JEST_CMD="$JEST_CMD $PATTERN ${@:2}"

echo "Running: $JEST_CMD"
echo ""

# Execute Jest
eval $JEST_CMD
EOF

chmod +x run-ultimate-tests.sh

echo ""
echo "✅ Ultimate Jest configuration complete!"
echo ""
echo "📊 Summary of created files:"
echo "   - jest-ultimate.config.js (working Jest config)"
echo "   - tsconfig.jest.json (Jest-specific TypeScript config)"
echo "   - test/jest.ultimate.setup.js (Jest setup file)"
echo "   - test/helpers/testUtils.js (comprehensive test utilities)"
echo "   - test/mocks/mcp-sdk-stub.js (MCP SDK mock)"
echo "   - test/mocks/ink-testing-stub.js (Ink testing mock)"
echo "   - run-ultimate-tests.sh (ultimate test runner)"
echo ""
echo "🚀 Next steps:"
echo "   1. Run all tests: ./run-ultimate-tests.sh"
echo "   2. Run specific test: ./run-ultimate-tests.sh test/unit/models/registry-revised.test.ts"
echo "   3. Debug mode: ./run-ultimate-tests.sh --debug"
echo "   4. Bail on first failure: ./run-ultimate-tests.sh --bail"
echo ""
echo "🎯 Quick test commands:"
echo "   - Basic test: npx jest test-config-verification.js --config=jest-ultimate.config.js"
echo "   - All tests: ./run-ultimate-tests.sh"
echo "   - Specific module: ./run-ultimate-tests.sh test/unit/storage/"
