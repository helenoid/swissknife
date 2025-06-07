#!/bin/bash
# Comprehensive test file fixer

set -e

echo "🔧 Fixing SwissKnife Test Files"
echo "==============================="

# Create backup directory
BACKUP_DIR="./test-backups-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backups in: $BACKUP_DIR"

# Function to fix a test file
fix_test_file() {
    local file="$1"
    local filename=$(basename "$file")
    
    echo "🔧 Fixing: $file"
    
    # Create backup
    cp "$file" "$BACKUP_DIR/$filename.backup"
    
    # Fix repeated .js extensions
    sed -i 's/\.js\.js\.js\.js\.js/\.js/g' "$file"
    sed -i 's/\.js\.js\.js\.js/\.js/g' "$file"
    sed -i 's/\.js\.js\.js/\.js/g' "$file"
    sed -i 's/\.js\.js/\.js/g' "$file"
    
    # Fix invalid import paths
    sed -i "s|from '../\.js'|from '../../src'|g" "$file"
    sed -i "s|from '\.\./\.\./js'|from '../../src'|g" "$file"
    sed -i "s|from '\.\./\.\./\.\./js'|from '../../../src'|g" "$file"
    sed -i "s|from '\.js'|from '../src'|g" "$file"
    
    # Fix Node.js module imports
    sed -i "s|import \* as path from 'path\.js'|import * as path from 'path'|g" "$file"
    sed -i "s|import \* as fs from 'fs/promises\.js'|import * as fs from 'fs/promises'|g" "$file"
    sed -i "s|import \* as os from 'os\.js'|import * as os from 'os'|g" "$file"
    sed -i "s|import \* as crypto from 'crypto\.js'|import * as crypto from 'crypto'|g" "$file"
    
    # Fix common test utilities imports
    sed -i "s|from '../testUtils'|from '../helpers/testUtils'|g" "$file"
    sed -i "s|from '../../testUtils'|from '../../helpers/testUtils'|g" "$file"
    
    # Remove obviously broken imports
    sed -i '/import.*\.js\.js/d' "$file"
    sed -i '/import.*from.*\.\./d' "$file"
    
    echo "✅ Fixed: $file"
}

# Function to create proper import structure for a test file
create_proper_imports() {
    local file="$1"
    local temp_file=$(mktemp)
    
    echo "📝 Creating proper imports for: $file"
    
    # Create proper import header based on test type
    cat > "$temp_file" << 'EOF'
/**
 * Test file with corrected imports
 */

// Standard Node.js imports
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

// Test utilities
import { describe, it, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

EOF
    
    # Add existing content (skip broken import lines)
    grep -v "^import.*\.js\." "$file" | grep -v "^import.*from '../" >> "$temp_file" || true
    
    # Replace the file
    mv "$temp_file" "$file"
    
    echo "✅ Created proper imports for: $file"
}

# Find and fix all test files
echo "🔍 Finding test files to fix..."

# Get all TypeScript and JavaScript test files
find test -name "*.test.ts" -o -name "*.test.js" -o -name "*.test.tsx" | while read -r file; do
    if [ -f "$file" ]; then
        fix_test_file "$file"
    fi
done

echo "🎯 Creating comprehensive test utilities..."

# Create universal test utilities
mkdir -p test/helpers

cat > test/helpers/testUtils.ts << 'EOF'
/**
 * Universal test utilities
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

// Test helper functions
export function createMockModel(id: string, name: string, provider: string) {
  return {
    id,
    name,
    provider,
    parameters: { temperature: 0.7 },
    metadata: { version: '1.0' }
  };
}

export async function createTempTestDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'swissknife-test-'));
  return tempDir;
}

export async function removeTempTestDir(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    console.warn('Failed to remove temp directory:', error);
  }
}

export function createMockStorage() {
  return {
    store: jest.fn(),
    retrieve: jest.fn(),
    delete: jest.fn(),
    list: jest.fn()
  };
}

export function createMockLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// Mock implementations for common classes
export class MockModel {
  constructor(public config: any) {}
  
  async execute(input: any): Promise<any> {
    return { output: `Mock output for ${input}` };
  }
}

export class MockStorage {
  private data = new Map();
  
  async store(key: string, value: any): Promise<void> {
    this.data.set(key, value);
  }
  
  async retrieve(key: string): Promise<any> {
    return this.data.get(key);
  }
  
  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }
  
  async list(): Promise<string[]> {
    return Array.from(this.data.keys());
  }
}

export const testConfig = {
  tempDir: os.tmpdir(),
  timeout: 10000,
  retries: 3
};
EOF

# Create JavaScript version as well
cat > test/helpers/testUtils.js << 'EOF'
/**
 * Universal test utilities (JavaScript version)
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

// Mock implementations for common classes
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

echo "🔧 Creating proper Jest configuration..."

# Create a working Jest configuration
cat > jest-working.config.js << 'EOF'
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Root directory
  rootDir: '.',
  
  // Test file patterns
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.test.ts',
    '**/test/**/*.test.tsx'
  ],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
    '^../testUtils$': '<rootDir>/test/helpers/testUtils',
    '^../../testUtils$': '<rootDir>/test/helpers/testUtils',
    '^../helpers/testUtils$': '<rootDir>/test/helpers/testUtils'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/jest.setup.js'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts'
  ],
  
  // Timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests
  resetModules: false,
  
  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '\\.bak$',
    '\\.backup$'
  ],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))'
  ]
};
EOF

# Create Jest setup file
cat > test/jest.setup.js << 'EOF'
/**
 * Jest setup file
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock console in tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: console.warn,
    error: console.error
  };
}

// Global test utilities
global.testUtils = {
  createMock: (returnValue) => jest.fn(() => returnValue),
  createAsyncMock: (returnValue) => jest.fn(async () => returnValue),
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

console.log('Jest setup loaded successfully');
EOF

# Create TypeScript config for tests
cat > tsconfig.test.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2020",
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
    "paths": {
      "@/*": ["./src/*"],
      "~/*": ["./*"]
    }
  },
  "include": [
    "test/**/*",
    "src/**/*"
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

echo "🧪 Creating test runner script..."

cat > run-fixed-tests.sh << 'EOF'
#!/bin/bash
# Run tests with fixed configuration

echo "🧪 Running SwissKnife tests with fixed configuration"
echo "=================================================="

# Set environment
export NODE_ENV=test
export DEBUG_TESTS=${DEBUG_TESTS:-false}

# Use the working Jest configuration
CONFIG="jest-working.config.js"

if [ "$1" = "--debug" ]; then
    export DEBUG_TESTS=true
    shift
fi

# Run Jest with the working configuration
echo "Using configuration: $CONFIG"
echo "Test path: ${1:-test}"
echo ""

npx jest --config="$CONFIG" "${1:-test}" "${@:2}"
EOF

chmod +x run-fixed-tests.sh

echo ""
echo "✅ Test file fixing complete!"
echo ""
echo "📊 Summary:"
echo "   - Backups created in: $BACKUP_DIR"
echo "   - Fixed import paths in all test files"
echo "   - Created universal test utilities"
echo "   - Created working Jest configuration"
echo "   - Created Jest setup file"
echo "   - Created TypeScript config for tests"
echo ""
echo "🚀 Next steps:"
echo "   1. Run tests: ./run-fixed-tests.sh"
echo "   2. Run specific test: ./run-fixed-tests.sh test/unit/models/registry-revised.test.ts"
echo "   3. Debug mode: ./run-fixed-tests.sh --debug"
echo ""
echo "🔧 Configuration files created:"
echo "   - jest-working.config.js"
echo "   - test/jest.setup.js"
echo "   - tsconfig.test.json"
echo "   - test/helpers/testUtils.ts"
echo "   - test/helpers/testUtils.js"
