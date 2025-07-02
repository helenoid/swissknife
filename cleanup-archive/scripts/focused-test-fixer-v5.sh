#!/bin/bash
# focused-test-fixer-v5.sh - Focused and targeted test fixing

set -e
cd /home/barberb/swissknife

echo "============================================"
echo "SwissKnife Focused Test Fixer v5.0"
echo "============================================"

# Fix specific issues in registry.test.ts
fix_registry_test() {
  echo "Fixing registry.test.ts..."
  
  # Fix the incorrect expectation syntax
  sed -i 's/expect(retrievedModel).toBeDefined()()/expect(retrievedModel).toBeDefined()/g' test/unit/models/registry.test.ts
  
  # Fix Chai/Jest mixed syntax
  sed -i 's/expect(\([^)]*\)).to.equal(\([^)]*\))/expect(\1).toBe(\2)/g' test/unit/models/registry.test.ts
  sed -i 's/expect(\([^)]*\)).to.be.undefined/expect(\1).toBeUndefined()/g' test/unit/models/registry.test.ts
  sed -i 's/expect(\([^)]*\)).not.toBe(\([^)]*\))/expect(\1).not.toBe(\2)/g' test/unit/models/registry.test.ts
}

# Fix Node.js module imports in simple-storage.test.js
fix_storage_test() {
  echo "Fixing simple-storage.test.js..."
  
  # Fix Node.js core module imports
  sed -i "s/import \* as path from 'path.js';/import * as path from 'path';/g" test/simple-storage.test.js
  sed -i "s/import \* as fs from 'fs\/promises.js';/import * as fs from 'fs\/promises';/g" test/simple-storage.test.js
  sed -i "s/import \* as os from 'os.js';/import * as os from 'os';/g" test/simple-storage.test.js
  
  # Create directory for FileStorage implementation
  mkdir -p src/storage

  # Check if the file-storage.js file exists
  if [ ! -f "src/storage/file-storage.js" ]; then
    echo "Creating file-storage.js implementation..."
    cat > src/storage/file-storage.js << 'EOF'
// FileStorage implementation
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

  # Create type definition file for FileStorage
  if [ ! -f "src/storage/file-storage.d.ts" ]; then
    echo "Creating file-storage.d.ts type definitions..."
    cat > src/storage/file-storage.d.ts << 'EOF'
export class FileStorage {
  constructor(options: {
    basePath: string;
    createDir?: boolean;
  });

  add(content: string | Buffer, options?: {
    contentType?: string;
    filename?: string;
  }): Promise<string>;

  get(cid: string): Promise<Buffer | null>;

  exists(cid: string): Promise<boolean>;

  delete(cid: string): Promise<boolean>;

  list(): Promise<string[]>;
}
EOF
  fi
}

# Fix the model_selector.test.tsx
fix_model_selector_test() {
  echo "Fixing model_selector.test.tsx..."

  # Create directory structure for mocks
  mkdir -p test/mocks/utils

  # Create mock implementation for config.js
  if [ ! -f "test/mocks/utils/config.js" ]; then
    echo "Creating config.js mock..."
    cat > test/mocks/utils/config.js << 'EOF'
export const getGlobalConfig = jest.fn();
export const saveGlobalConfig = jest.fn();
export const addApiKey = jest.fn();
export const ProviderType = { 
  OPENAI: 'openai', 
  ANTHROPIC: 'anthropic', 
  LILYPAD: 'lilypad' 
};
EOF
  fi

  # Create mock implementation for sessionState.js
  if [ ! -f "test/mocks/utils/sessionState.js" ]; then
    echo "Creating sessionState.js mock..."
    cat > test/mocks/utils/sessionState.js << 'EOF'
export const getSessionState = jest.fn();
export const setSessionState = jest.fn();
EOF
  fi

  # Fix the import paths in the test
  sed -i "s/import { ModelSelector } from '\.\.\/\.js';/import { ModelSelector } from '\.\.\/src\/components\/ModelSelector.js';/g" test/model_selector.test.tsx 2>/dev/null || true
  sed -i "s/import { getGlobalConfig, saveGlobalConfig, addApiKey } from '\.\.\/\.js';/import { getGlobalConfig, saveGlobalConfig, addApiKey } from '\.\.\/src\/utils\/config.js';/g" test/model_selector.test.tsx 2>/dev/null || true
  sed -i "s/import { getSessionState, setSessionState } from '\.\.\/\.js';/import { getSessionState, setSessionState } from '\.\.\/src\/utils\/sessionState.js';/g" test/model_selector.test.tsx 2>/dev/null || true
}

# Create enhanced test setup
create_enhanced_setup() {
  echo "Creating enhanced Jest setup..."
  
  # Create unified-setup.js if it doesn't exist
  if [ ! -f "test/unified-setup.js" ]; then
    echo "Creating unified-setup.js..."
    cat > test/unified-setup.js << 'EOF'
// Unified Jest setup file for all tests
// This addresses compatibility issues between Jest and Chai assertions

// Check if we're in a Jest environment
const isJestEnv = typeof jest !== 'undefined';

// If in Jest, polyfill Chai assertions onto Jest's expect
if (isJestEnv) {
  // Store original methods
  const originalExpect = global.expect;
  
  // Create a chai-like interface that maps to Jest
  const chaiInterface = {
    to: {
      equal: function(expected) { return originalExpect(this.actual).toBe(expected); },
      be: {
        undefined: function() { return originalExpect(this.actual).toBeUndefined(); },
        null: function() { return originalExpect(this.actual).toBeNull(); },
        true: function() { return originalExpect(this.actual).toBe(true); },
        false: function() { return originalExpect(this.actual).toBe(false); },
        defined: function() { return originalExpect(this.actual).toBeDefined(); }
      },
      have: {
        length: function(len) { return originalExpect(this.actual).toHaveLength(len); },
        property: function(prop) { return originalExpect(this.actual).toHaveProperty(prop); }
      },
      include: function(item) { return originalExpect(this.actual).toContain(item); },
      deep: {
        equal: function(expected) { return originalExpect(this.actual).toEqual(expected); }
      }
    }
  };
  
  // Monkey-patch expect to handle both Jest and Chai syntaxes
  global.expect = function(actual) {
    const jestExpect = originalExpect(actual);
    // Add compatibility with chai expect
    const chaiExpect = Object.create(chaiInterface);
    chaiExpect.actual = actual;
    
    // Combine both interfaces
    return Object.assign(jestExpect, {
      to: chaiExpect.to
    });
  };

  // Preserve Jest's native functions in the global scope
  Object.assign(global.expect, originalExpect);
}

// Export for CommonJS compatibility
module.exports = {};
EOF
  fi
}

# Create optimized Jest config
create_optimized_configs() {
  echo "Creating optimized Jest configs..."
  
  # Create jest.optimized.config.cjs
  cat > jest.optimized.config.cjs << 'EOF'
/** @type {import('jest').Config} */
module.exports = {
  // Basic configuration
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 60000,

  // Disable watchman for better CI compatibility
  watchman: false,
  
  // Handle Haste module naming collisions
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },

  // Transform configuration for JS/TS files
  transform: {
    "^.+\\.(t|j)sx?$": [
      "babel-jest", 
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript",
          ["@babel/preset-react", { runtime: "automatic" }]
        ],
        plugins: ["@babel/plugin-transform-modules-commonjs"]
      }
    ]
  },
  
  // Transform node_modules with ESM
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/test/unified-setup.js"],

  // Module file extensions to look for
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  
  // Module name mapping for mocks
  moduleNameMapper: {
    "\\.(css|scss)$": "<rootDir>/test/mocks/stubs/style-mock.js",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/test/mocks/stubs/file-mock.js",
  }
};
EOF
}

# Create simple style and file mocks
create_simple_mocks() {
  echo "Creating simple mocks..."
  
  mkdir -p test/mocks/stubs
  
  # Create style-mock.js if it doesn't exist
  if [ ! -f "test/mocks/stubs/style-mock.js" ]; then
    echo "Creating style-mock.js..."
    cat > test/mocks/stubs/style-mock.js << 'EOF'
// Mock for style imports (CSS/SCSS)
module.exports = {};
EOF
  fi
  
  # Create file-mock.js if it doesn't exist
  if [ ! -f "test/mocks/stubs/file-mock.js" ]; then
    echo "Creating file-mock.js..."
    cat > test/mocks/stubs/file-mock.js << 'EOF'
// Mock for file imports (images, etc.)
module.exports = 'test-file-stub';
EOF
  fi
}

# Run the specific tests
run_specific_tests() {
  echo "Running specific tests with optimized config..."
  
  TEST_RESULTS_DIR="test-results-$(date +%Y%m%d_%H%M%S)"
  mkdir -p "$TEST_RESULTS_DIR"
  
  # Run registry test
  echo "Running registry.test.ts..."
  NODE_OPTIONS=--experimental-vm-modules npx jest test/unit/models/registry.test.ts \
    --config=jest.optimized.config.cjs \
    --detectOpenHandles \
    --forceExit \
    > "$TEST_RESULTS_DIR/registry-test-output.log" 2>&1 || true
  
  # Run storage test
  echo "Running simple-storage.test.js..."
  NODE_OPTIONS=--experimental-vm-modules npx jest test/simple-storage.test.js \
    --config=jest.optimized.config.cjs \
    --detectOpenHandles \
    --forceExit \
    > "$TEST_RESULTS_DIR/storage-test-output.log" 2>&1 || true
  
  # Check if tests passed
  if grep -q "PASS" "$TEST_RESULTS_DIR/registry-test-output.log"; then
    echo "✅ PASS: registry.test.ts"
  else
    echo "❌ FAIL: registry.test.ts"
  fi
  
  if grep -q "PASS" "$TEST_RESULTS_DIR/storage-test-output.log"; then
    echo "✅ PASS: simple-storage.test.js"
  else
    echo "❌ FAIL: simple-storage.test.js"
  fi
  
  # Generate summary
  cat > "$TEST_RESULTS_DIR/summary.md" << EOF
# Test Summary - $(date)

## Results
$(if grep -q "PASS" "$TEST_RESULTS_DIR/registry-test-output.log"; then
  echo "- ✅ registry.test.ts PASSED"
else
  echo "- ❌ registry.test.ts FAILED"
fi)

$(if grep -q "PASS" "$TEST_RESULTS_DIR/storage-test-output.log"; then
  echo "- ✅ simple-storage.test.js PASSED"
else
  echo "- ❌ simple-storage.test.js FAILED"
fi)

## Test Diagnostics
See the individual log files for detailed error information.
EOF

  echo "Test results saved to: $TEST_RESULTS_DIR"
}

# Main execution
echo "Step 1: Creating enhanced setup and mocks..."
create_enhanced_setup
create_optimized_configs
create_simple_mocks

echo "Step 2: Fixing registry.test.ts..."
fix_registry_test

echo "Step 3: Fixing simple-storage.test.js..."
fix_storage_test

echo "Step 4: Fixing model_selector.test.tsx..."
fix_model_selector_test

echo "Step 5: Running specific tests..."
run_specific_tests

echo "============================================"
echo "Test fixing completed!"
echo "============================================"
