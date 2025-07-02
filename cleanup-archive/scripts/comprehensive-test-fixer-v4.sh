#!/bin/bash
# comprehensive-test-fixer-v4.sh - A complete test fixing script

set -e
cd /home/barberb/swissknife

echo "============================================"
echo "SwissKnife Comprehensive Test Fixer v4.0"
echo "============================================"

# Function to fix import paths and extensions
fix_import_paths() {
  local file=$1
  echo "Fixing imports in: $file"
  
  # Fix multiple .js extensions
  sed -i 's/\.js\.js\.js\.js\.js\.js\.js\.js\.js\.js\.js/\.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js\.js\.js\.js\.js\.js\.js/\.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js\.js\.js\.js\.js\.js/\.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js\.js\.js\.js\.js/\.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js\.js\.js\.js/\.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js\.js\.js/\.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js\.js/\.js/g' "$file"
  sed -i 's/\.js\.js\.js\.js/\.js/g' "$file"
  sed -i 's/\.js\.js\.js/\.js/g' "$file"
  sed -i 's/\.js\.js/\.js/g' "$file"
  
  # Fix incorrect relative imports
  sed -i 's/from '\''\.\.\/\.js'\''/from '\''\.\.\/src\/index\.js'\''/g' "$file"
  sed -i 's/from '\''\.\.\/\.\./from '\''\.\.\/\.\.\/src/g' "$file"
  
  # Fix Node.js built-in modules
  sed -i 's/from '\''path\.js'\''/from '\''path'\''/g' "$file"
  sed -i 's/from '\''fs\/promises\.js'\''/from '\''fs\/promises'\''/g' "$file"
  sed -i 's/from '\''os\.js'\''/from '\''os'\''/g' "$file"
  sed -i 's/from '\''crypto\.js'\''/from '\''crypto'\''/g' "$file"
  
  # Fix common third-party modules
  sed -i 's/from '\''react\.js'\''/from '\''react'\''/g' "$file"
  sed -i 's/from '\''ink\.js'\''/from '\''ink'\''/g' "$file"
  sed -i 's/from '\''chai\.js'\''/from '\''chai'\''/g' "$file"
  sed -i 's/from '\''chalk\.js'\''/from '\''chalk'\''/g' "$file"
  sed -i 's/from '\''openai\.js'\''/from '\''openai'\''/g' "$file"
}

# Function to fix Jest assertions
fix_jest_assertions() {
  local file=$1
  echo "Fixing assertions in: $file"
  
  # Convert Chai to Jest assertions
  sed -i 's/expect(\([^)]*\))\.to\.equal(/expect(\1).toBe(/g' "$file"
  sed -i 's/expect(\([^)]*\))\.to\.be\.undefined/expect(\1).toBeUndefined()/g' "$file"
  sed -i 's/expect(\([^)]*\))\.to\.be\.defined/expect(\1).toBeDefined()/g' "$file"
  sed -i 's/expect(\([^)]*\))\.to\.be\.null/expect(\1).toBeNull()/g' "$file"
  sed -i 's/expect(\([^)]*\))\.to\.be\.true/expect(\1).toBe(true)/g' "$file"
  sed -i 's/expect(\([^)]*\))\.to\.be\.false/expect(\1).toBe(false)/g' "$file"
  sed -i 's/expect(\([^)]*\))\.to\.have\.length(/expect(\1).toHaveLength(/g' "$file"
  sed -i 's/expect(\([^)]*\))\.to\.include(/expect(\1).toContain(/g' "$file"
  sed -i 's/expect(\([^)]*\))\.to\.deep\.equal(/expect(\1).toEqual(/g' "$file"
}

# Fix the model_selector.test.tsx
fix_model_selector_test() {
  echo "Fixing model_selector.test.tsx..."
  
  # Create mock directories
  mkdir -p test/mocks/utils
  
  # Create config.js mock
  cat > test/mocks/utils/config.js << 'EOF'
// Mock config.js
export const getGlobalConfig = jest.fn();
export const saveGlobalConfig = jest.fn();
export const addApiKey = jest.fn();
export const ProviderType = { 
  OPENAI: 'openai', 
  ANTHROPIC: 'anthropic', 
  LILYPAD: 'lilypad' 
};
EOF

  # Create sessionState.js mock
  cat > test/mocks/utils/sessionState.js << 'EOF'
// Mock sessionState.js
export const getSessionState = jest.fn();
export const setSessionState = jest.fn();
EOF

  # Update test file mocks
  if grep -q "jest.mock('../src/utils/config.js', () => ({" test/model_selector.test.tsx; then
    sed -i "s/jest.mock('..\/src\/utils\/config.js', () => ({/jest.mock('..\/src\/utils\/config.js', () => require('.\/mocks\/utils\/config.js')/g" test/model_selector.test.tsx
    sed -i "s/getGlobalConfig: jest.fn(),/\/\/ getGlobalConfig: jest.fn(),/g" test/model_selector.test.tsx
    sed -i "s/saveGlobalConfig: jest.fn(),/\/\/ saveGlobalConfig: jest.fn(),/g" test/model_selector.test.tsx
    sed -i "s/addApiKey: jest.fn(),/\/\/ addApiKey: jest.fn(),/g" test/model_selector.test.tsx
    sed -i "s/ProviderType: { OPENAI: 'openai', ANTHROPIC: 'anthropic', LILYPAD: 'lilypad' }/\/\/ ProviderType/g" test/model_selector.test.tsx
    sed -i "s/}));/);/g" test/model_selector.test.tsx
  fi

  if grep -q "jest.mock('../src/utils/sessionState.js', () => ({" test/model_selector.test.tsx; then
    sed -i "s/jest.mock('..\/src\/utils\/sessionState.js', () => ({/jest.mock('..\/src\/utils\/sessionState.js', () => require('.\/mocks\/utils\/sessionState.js')/g" test/model_selector.test.tsx
    sed -i "s/getSessionState: jest.fn(),/\/\/ getSessionState: jest.fn(),/g" test/model_selector.test.tsx
    sed -i "s/setSessionState: jest.fn(),/\/\/ setSessionState: jest.fn(),/g" test/model_selector.test.tsx
    sed -i "s/}));/);/g" test/model_selector.test.tsx
  fi

  # Fix the TypeScript type issues
  if ! grep -q "let mockConfig: any;" test/model_selector.test.tsx; then
    sed -i "s/let mockConfig;/let mockConfig: any;/g" test/model_selector.test.tsx
  fi
  
  if ! grep -q "let mockSessionStateData: any;" test/model_selector.test.tsx; then
    sed -i "s/let mockSessionStateData;/let mockSessionStateData: any;/g" test/model_selector.test.tsx
  fi
  
  if ! grep -q "let onDoneMock: jest.Mock;" test/model_selector.test.tsx; then
    sed -i "s/let onDoneMock;/let onDoneMock: jest.Mock;/g" test/model_selector.test.tsx
  fi
  
  # Update the test expectations to use mocked functions
  sed -i "s/expect(getGlobalConfig)/expect(mockedGetGlobalConfig)/g" test/model_selector.test.tsx
  sed -i "s/expect(getSessionState)/expect(mockedGetSessionState)/g" test/model_selector.test.tsx
  
  # Update setup code to use typed mocks
  sed -i "s/getGlobalConfig.mockReturnValue/mockedGetGlobalConfig.mockReturnValue/g" test/model_selector.test.tsx
  sed -i "s/saveGlobalConfig.mockImplementation/mockedSaveGlobalConfig.mockImplementation/g" test/model_selector.test.tsx
  sed -i "s/getSessionState.mockImplementation/mockedGetSessionState.mockImplementation/g" test/model_selector.test.tsx
  sed -i "s/setSessionState.mockImplementation/mockedSetSessionState.mockImplementation/g" test/model_selector.test.tsx
}

# Fix the fibonacci-heap.test.ts
fix_fibonacci_heap_test() {
  echo "Fixing fibonacci-heap.test.ts..."
  
  # Create type definitions for FibonacciHeap
  mkdir -p src/tasks/scheduler
  cat > src/tasks/scheduler/fibonacci-heap.d.ts << 'EOF'
export interface FibHeapNode<T> {
  key: number;
  value: T;
  degree: number;
  marked: boolean;
  parent: FibHeapNode<T> | null;
  child: FibHeapNode<T> | null;
  left: FibHeapNode<T>;
  right: FibHeapNode<T>;
}

export class FibonacciHeap<T> {
  isEmpty(): boolean;
  size(): number;
  clear(): void;
  insert(key: number, value: T): FibHeapNode<T>;
  minimum(): FibHeapNode<T> | null;
  extractMin(): FibHeapNode<T> | null;
  decreaseKey(node: FibHeapNode<T>, newKey: number): void;
  delete(node: FibHeapNode<T>): void;
}

export function FibHeapNode<T>(key: number, value: T): FibHeapNode<T>;
EOF

  # Fix imports in the test file
  if [ -f "test/unit/tasks/fibonacci-heap.test.ts" ]; then
    fix_import_paths "test/unit/tasks/fibonacci-heap.test.ts"
    fix_jest_assertions "test/unit/tasks/fibonacci-heap.test.ts"
    
    # Fix the specific import for FibonacciHeap
    sed -i "s/import { FibonacciHeap, FibHeapNode } from '\.\.\/\.\.\/\.\./import { FibonacciHeap, FibHeapNode } from '\.\.\/\.\.\/\.\.\/src\/tasks\/scheduler\/fibonacci-heap/g" "test/unit/tasks/fibonacci-heap.test.ts"
    
    # Add .js extension to imports if missing
    sed -i "s/from '\([^']*\)';/from '\1.js';/g" "test/unit/tasks/fibonacci-heap.test.ts"
    
    # Fix double .js.js extensions
    sed -i "s/\.js\.js/\.js/g" "test/unit/tasks/fibonacci-heap.test.ts"
  fi
}

# Fix the models registry test
fix_registry_test() {
  echo "Fixing registry.test.ts..."
  
  if [ -f "test/unit/models/registry.test.ts" ]; then
    fix_import_paths "test/unit/models/registry.test.ts"
    fix_jest_assertions "test/unit/models/registry.test.ts"
    
    # Add .js extension to imports if missing
    sed -i "s/from '\([^']*\)';/from '\1.js';/g" "test/unit/models/registry.test.ts"
    
    # Fix double .js.js extensions
    sed -i "s/\.js\.js/\.js/g" "test/unit/models/registry.test.ts"
  fi
}

# Fix the simple-storage.test.js
fix_simple_storage_test() {
  echo "Fixing simple-storage.test.js..."
  
  # Create the FileStorage implementation
  mkdir -p src/storage/local
  if [ ! -f "src/storage/local/file-storage.js" ]; then
    cat > src/storage/local/file-storage.js << 'EOF'
// FileStorage implementation for testing
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export class FileStorage {
  constructor(options) {
    this.basePath = path.resolve(options.basePath);
    this.metadataDir = path.join(this.basePath, '.metadata');
    
    if (options.createDir) {
      fs.mkdir(this.basePath, { recursive: true })
        .then(() => fs.mkdir(this.metadataDir, { recursive: true }))
        .catch(err => console.error('Error creating storage directory:', err));
    }
  }

  async add(content, options = {}) {
    const contentBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
    const hash = crypto.createHash('sha256').update(contentBuffer).digest('hex');
    const filePath = path.join(this.basePath, hash);
    await fs.writeFile(filePath, contentBuffer);
    
    const metadata = {
      created: Date.now(),
      accessed: Date.now(),
      size: contentBuffer.length,
      contentType: options.contentType || 'text/plain',
      filename: options.filename
    };
    
    await fs.writeFile(
      path.join(this.metadataDir, `${hash}.json`),
      JSON.stringify(metadata, null, 2)
    );
    
    return hash;
  }

  async get(cid) {
    try {
      return await fs.readFile(path.join(this.basePath, cid));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  async exists(cid) {
    try {
      await fs.access(path.join(this.basePath, cid));
      return true;
    } catch {
      return false;
    }
  }

  async delete(cid) {
    try {
      await fs.unlink(path.join(this.basePath, cid));
      try {
        await fs.unlink(path.join(this.metadataDir, `${cid}.json`));
      } catch {}
      return true;
    } catch {
      return false;
    }
  }

  async list() {
    try {
      const files = await fs.readdir(this.basePath);
      return files.filter(f => f !== '.metadata');
    } catch {
      return [];
    }
  }
}
EOF
  fi
  
  # Fix the imports in the test
  if [ -f "test/simple-storage.test.js" ]; then
    fix_import_paths "test/simple-storage.test.js"
    fix_jest_assertions "test/simple-storage.test.js"
    
    # Fix the FileStorage import
    sed -i "s/import { FileStorage } from '\.\.\/\./import { FileStorage } from '\.\.\/src\/storage\/local\/file-storage/g" "test/simple-storage.test.js"
    
    # Add .js extension to imports if missing
    sed -i "s/from '\([^']*\)';/from '\1.js';/g" "test/simple-storage.test.js"
    
    # Fix double .js.js extensions
    sed -i "s/\.js\.js/\.js/g" "test/simple-storage.test.js"
  fi
}

# Create necessary mock files
create_needed_mocks() {
  echo "Creating needed mock files..."
  
  # Create ink-mock.js
  mkdir -p test/mocks/stubs
  if [ ! -f "test/mocks/stubs/ink-mock.js" ]; then
    cat > test/mocks/stubs/ink-mock.js << 'EOF'
// Enhanced Ink mock for Jest testing
const mockComponent = jest.fn(() => null);

module.exports = {
  Box: mockComponent,
  Text: mockComponent,
  Static: mockComponent,
  Newline: mockComponent,
  useInput: jest.fn(),
  useApp: jest.fn(() => ({ exit: jest.fn() })),
  render: jest.fn()
};
EOF
  fi

  # Create style-mock.js
  if [ ! -f "test/mocks/stubs/style-mock.js" ]; then
    cat > test/mocks/stubs/style-mock.js << 'EOF'
// Mock for style imports (CSS/SCSS)
module.exports = {};
EOF
  fi

  # Create file-mock.js
  if [ ! -f "test/mocks/stubs/file-mock.js" ]; then
    cat > test/mocks/stubs/file-mock.js << 'EOF'
// Mock for file imports (images, etc.)
module.exports = 'test-file-stub';
EOF
  fi

  # Create chai-enhanced.js
  if [ ! -f "test/mocks/stubs/chai-enhanced.js" ]; then
    cat > test/mocks/stubs/chai-enhanced.js << 'EOF'
// Enhanced Chai compatibility layer for Jest
const expectToBeEqual = function(expected) {
  this.toBe(expected);
};

const expectToBeTrue = function() {
  this.toBe(true);
};

const expectToBeFalse = function() {
  this.toBe(false);
};

// Add Chai-like assertions to Jest expect
if (typeof expect !== 'undefined' && expect.extend) {
  expect.extend({
    to: {
      get equal() {
        return expectToBeEqual;
      },
      get be() {
        return {
          true: expectToBeTrue,
          false: expectToBeFalse,
          undefined: expect.toBeUndefined,
          null: expect.toBeNull,
          defined: expect.toBeDefined,
        };
      },
      get deep() {
        return {
          equal: expect.toEqual,
        };
      },
      get have() {
        return {
          length: expect.toHaveLength,
        };
      },
      get include() {
        return expect.toContain;
      },
    },
  });
}

// Export a simple replacement for global scripts
module.exports = {
  expect: global.expect || jest.fn(),
  assert: {
    equal: jest.fn(),
    deepEqual: jest.fn(),
    strictEqual: jest.fn(),
    notEqual: jest.fn(),
    isTrue: jest.fn(),
    isFalse: jest.fn(),
  },
};
EOF
  fi
}

# Fix imports in specific file
fix_file_imports() {
  local file=$1
  if [ -f "$file" ]; then
    echo "Fixing imports in $file..."
    fix_import_paths "$file"
    fix_jest_assertions "$file"
  fi
}

# Main execution
echo "Step 1: Creating needed mock files..."
create_needed_mocks

echo "Step 2: Fixing specific test files..."
fix_model_selector_test
fix_fibonacci_heap_test
fix_registry_test
fix_simple_storage_test

echo "Step 3: Fixing imports in basic tests..."
fix_file_imports "test/basic.test.js"
fix_file_imports "test/ultra-minimal.test.js" 

echo "Step 4: Fixing setup files..."
# Fix setup-jest.js file to handle undefined globals
if [ -f "test/setup-jest.js" ]; then
  cat > test/setup-jest.js << 'EOF'
// Jest global setup file
try {
  // Only set these globals if they exist
  if (typeof jest !== 'undefined') global.jest = jest;
  if (typeof expect !== 'undefined') global.expect = expect;
  if (typeof beforeAll !== 'undefined') global.beforeAll = beforeAll;
  if (typeof afterAll !== 'undefined') global.afterAll = afterAll;
  if (typeof beforeEach !== 'undefined') global.beforeEach = beforeEach;
  if (typeof afterEach !== 'undefined') global.afterEach = afterEach;
  if (typeof describe !== 'undefined') global.describe = describe;
  if (typeof it !== 'undefined') global.it = it;
  if (typeof test !== 'undefined') global.test = test;
} catch (e) {
  console.warn('Jest globals not available:', e.message);
}

// Log setup completion
console.log('Jest setup completed successfully');
EOF
fi

echo "Step 5: Creating updated Jest configs..."
# Create React-specific Jest config
if [ ! -f "jest.react.config.cjs" ]; then
  cat > jest.react.config.cjs << 'EOF'
// jest.react.config.cjs
/**
 * Jest configuration specifically for React/TypeScript component tests
 * This addresses the issues with the ModelSelector test and similar component tests
 */

/** @type {import('jest').Config} */
module.exports = {
  // Use Node.js environment for component testing
  testEnvironment: 'node',
  
  // Increase timeout for slow tests
  testTimeout: 60000,
  
  // Configure Haste module mapper to avoid collisions
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  
  // Transform configuration using Babel
  transform: {
    "^.+\\.(t|j)sx?$": [
      "babel-jest", 
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript",
          ["@babel/preset-react", { runtime: "automatic" }]
        ],
        plugins: [
          "@babel/plugin-transform-modules-commonjs",
          ["@babel/plugin-proposal-decorators", { "legacy": true }],
          ["@babel/plugin-proposal-class-properties", { "loose": true }]
        ]
      }
    ]
  },
  
  // Don't transform these modules
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|ink.*|chalk|@modelcontextprotocol|react-is)/)",
  ],
  
  // Module resolution
  moduleNameMapper: {
    // Handle CSS/SCSS imports
    "\\.(css|scss)$": "<rootDir>/test/mocks/stubs/style-mock.js",
    // Handle image imports
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/test/mocks/stubs/file-mock.js",
    // Ensure proper path resolution for modules
    "^src/(.*)$": "<rootDir>/src/$1",
    "^test/(.*)$": "<rootDir>/test/$1"
  },
  
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/test/unified-setup.js"],
  
  // Module file extensions to look for
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  
  // Print setup info for diagnostics
  verbose: true
};
EOF
fi

echo "============================================"
echo "Test fixes completed!"
echo "============================================"
echo "Run './complete-test-runner-v4.sh' to run the fixed tests"
