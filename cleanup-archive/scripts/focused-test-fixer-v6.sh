#!/bin/bash
# focused-test-fixer-v6.sh - A targeted script to fix the core failing tests

set -e
cd /home/barberb/swissknife

echo "============================================"
echo "SwissKnife Focused Test Fixer v6.0"
echo "============================================"

# Create test results directory
TEST_RESULTS_DIR="test-results-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEST_RESULTS_DIR"

# Fix registry test
fix_registry_test() {
  echo "Fixing registry.test.ts..."
  
  # Fix assertion syntax
  sed -i 's/expect(retrievedModel).toBeDefined()()/expect(retrievedModel).toBeDefined()/g' test/unit/models/registry.test.ts
  sed -i 's/expect(\([^)]*\)).to.equal(/expect(\1).toBe(/g' test/unit/models/registry.test.ts
  sed -i 's/expect(\([^)]*\)).not.toBe(\([^)]*\))/expect(\1).not.toEqual(\2)/g' test/unit/models/registry.test.ts
  sed -i 's/expect(\([^)]*\)).to.be.undefined/expect(\1).toBeUndefined()/g' test/unit/models/registry.test.ts
  
  echo "Registry test fixed!"
}

# Fix simple-storage test
fix_simple_storage_test() {
  echo "Fixing simple-storage.test.js..."
  
  # Fix node module imports
  sed -i "s/import \* as path from 'path.js';/import * as path from 'path';/g" test/simple-storage.test.js
  sed -i "s/import \* as fs from 'fs\/promises.js';/import * as fs from 'fs\/promises';/g" test/simple-storage.test.js
  sed -i "s/import \* as os from 'os.js';/import * as os from 'os';/g" test/simple-storage.test.js
  
  # Fix FileStorage import
  if ! grep -q "../src/storage/local/file-storage.js" test/simple-storage.test.js; then
    # Create storage directory if needed
    mkdir -p src/storage/local
    
    # Copy file-storage.js from dist-test if it exists
    if [ -f "dist-test/src/storage/local/file-storage.js" ]; then
      cp -f "dist-test/src/storage/local/file-storage.js" "src/storage/local/file-storage.js"
    else
      # Create minimal FileStorage implementation
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
    
    # Update the import in the test file
    sed -i "s/import { FileStorage } from '..\/src\/storage\/file-storage.js';/import { FileStorage } from '..\/src\/storage\/local\/file-storage.js';/g" test/simple-storage.test.js
  fi
  
  echo "Simple storage test fixed!"
}

# Fix model_selector test
fix_model_selector_test() {
  echo "Fixing model_selector.test.tsx..."
  
  # Create mock directories if needed
  mkdir -p test/mocks/utils
  
  # Create required mocks if they don't exist
  if [ ! -f "test/mocks/utils/config.js" ]; then
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
  fi

  if [ ! -f "test/mocks/utils/sessionState.js" ]; then
    cat > test/mocks/utils/sessionState.js << 'EOF'
// Mock sessionState.js
export const getSessionState = jest.fn();
export const setSessionState = jest.fn();
EOF
  fi
  
  # Fix TypeScript type issues in the test
  sed -i 's/let mockConfig;/let mockConfig: any;/g' test/model_selector.test.tsx
  sed -i 's/let mockSessionStateData;/let mockSessionStateData: any;/g' test/model_selector.test.tsx
  sed -i 's/let onDoneMock;/let onDoneMock: jest.Mock;/g' test/model_selector.test.tsx
  
  echo "Model selector test fixed!"
}

# Run a specific test with error handling
run_test() {
  local test_file=$1
  local test_name=$(basename "$test_file" | sed 's/\.test\..*//')
  
  echo "Running $test_file..."
  
  NODE_OPTIONS="--experimental-vm-modules" npx jest "$test_file" \
    --config=jest-modern-focused.config.cjs \
    --detectOpenHandles \
    --forceExit \
    --no-cache > "$TEST_RESULTS_DIR/${test_name}-output.log" 2>&1 || true
  
  if grep -q "PASS" "$TEST_RESULTS_DIR/${test_name}-output.log"; then
    echo "✅ PASS: $test_file"
    echo "$test_file" >> "$TEST_RESULTS_DIR/passed.txt"
  else
    echo "❌ FAIL: $test_file - See $TEST_RESULTS_DIR/${test_name}-output.log for details"
    echo "$test_file" >> "$TEST_RESULTS_DIR/failed.txt"
    
    # Extract error message for diagnostics
    grep -A 10 "FAIL" "$TEST_RESULTS_DIR/${test_name}-output.log" > "$TEST_RESULTS_DIR/${test_name}-error.txt"
  fi
}

# Create a modern focused Jest config
create_focused_jest_config() {
  cat > jest-modern-focused.config.cjs << 'EOF'
/**
 * Modern focused Jest configuration
 * Designed specifically for the core failing tests
 */

/** @type {import('jest').Config} */
module.exports = {
  // Basic configuration
  testEnvironment: 'node',
  verbose: true,
  testTimeout: 30000,
  
  // Disable cache for fresh runs
  cache: false,
  
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
        plugins: [
          "@babel/plugin-transform-modules-commonjs"
        ]
      }
    ]
  },
  
  // Don't transform node_modules with ES modules
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|ink.*|chalk)/)"
  ],
  
  // Module resolution
  moduleNameMapper: {
    // Handle CSS imports
    "\\.(css|scss)$": "<rootDir>/test/mocks/stubs/style-mock.js",
    // Handle image imports
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/test/mocks/stubs/file-mock.js",
  },
  
  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  
  // Setup files
  setupFilesAfterEnv: ["<rootDir>/test/setup-jest.js"]
};
EOF

  echo "Created modern focused Jest config"
}

# Create a minimal setup-jest.js file
create_minimal_setup() {
  cat > test/setup-jest.js << 'EOF'
// Minimal Jest setup file
try {
  // Only set these globals if they exist
  if (typeof jest !== 'undefined') global.jest = jest;
  if (typeof expect !== 'undefined') global.expect = expect;
  if (typeof describe !== 'undefined') global.describe = describe;
  if (typeof it !== 'undefined') global.it = it;
  if (typeof test !== 'undefined') global.test = test;
  if (typeof beforeAll !== 'undefined') global.beforeAll = beforeAll;
  if (typeof afterAll !== 'undefined') global.afterAll = afterAll;
  if (typeof beforeEach !== 'undefined') global.beforeEach = beforeEach;
  if (typeof afterEach !== 'undefined') global.afterEach = afterEach;
} catch (e) {
  console.warn('Jest globals not fully available:', e.message);
}

// Add mock for chai expect
global.chai = {
  expect: global.expect
};

console.log('Jest setup completed');
EOF

  echo "Created minimal Jest setup file"
}

# Create mock stubs directory
create_mock_stubs() {
  mkdir -p test/mocks/stubs
  
  # Create style-mock.js if it doesn't exist or is empty
  if [ ! -s "test/mocks/stubs/style-mock.js" ]; then
    cat > test/mocks/stubs/style-mock.js << 'EOF'
// Mock for style imports (CSS/SCSS)
module.exports = {};
EOF
  fi
  
  # Create file-mock.js if it doesn't exist or is empty
  if [ ! -s "test/mocks/stubs/file-mock.js" ]; then
    cat > test/mocks/stubs/file-mock.js << 'EOF'
// Mock for file imports (images, etc.)
module.exports = 'test-file-stub';
EOF
  fi
  
  echo "Created mock stubs"
}

# Main execution
echo "Step 1: Creating prerequisites..."
create_focused_jest_config
create_minimal_setup
create_mock_stubs

echo "Step 2: Fixing registry test..."
fix_registry_test

echo "Step 3: Fixing simple-storage test..."
fix_simple_storage_test

echo "Step 4: Fixing model_selector test..."
fix_model_selector_test

echo "Step 5: Running tests with modern config..."
run_test "test/unit/models/registry.test.ts"
run_test "test/simple-storage.test.js"
run_test "test/model_selector.test.tsx"

# Generate summary report
echo "Generating test report..."
cat > "$TEST_RESULTS_DIR/summary.md" << EOF
# SwissKnife Focused Test Report - $(date)

## Summary
- Passed: $([ -f "$TEST_RESULTS_DIR/passed.txt" ] && wc -l < "$TEST_RESULTS_DIR/passed.txt" || echo "0")
- Failed: $([ -f "$TEST_RESULTS_DIR/failed.txt" ] && wc -l < "$TEST_RESULTS_DIR/failed.txt" || echo "0")

## Test Results
$(if [ -f "$TEST_RESULTS_DIR/passed.txt" ]; then
  echo "### Passed Tests"
  cat "$TEST_RESULTS_DIR/passed.txt" | sed 's/^/- /'
fi)

$(if [ -f "$TEST_RESULTS_DIR/failed.txt" ]; then
  echo "### Failed Tests"
  cat "$TEST_RESULTS_DIR/failed.txt" | sed 's/^/- /'
fi)

## Fixed Issues
1. Registry test - Fixed assertion syntax
2. Simple-storage test - Fixed Node.js imports and FileStorage implementation
3. Model_selector test - Fixed mock implementations and TypeScript type issues

## Next Steps
1. For any remaining failing tests, check the detailed error logs
2. Apply fixes to other similar tests following the same patterns
3. Set up a continuous testing process to catch regression issues
EOF

echo "============================================"
echo "Test fixing and execution completed!"
echo "Results saved to: $TEST_RESULTS_DIR"
echo "============================================"
cat "$TEST_RESULTS_DIR/summary.md"
