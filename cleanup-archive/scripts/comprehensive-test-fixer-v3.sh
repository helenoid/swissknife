#!/bin/bash
# comprehensive-test-fixer-v3.sh - Complete test fixing strategy

set -e
cd /home/barberb/swissknife

echo "============================================"
echo "SwissKnife Comprehensive Test Fixer v3.0"
echo "============================================"

# Function to fix import paths and extensions
fix_import_paths() {
    local file="$1"
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
    
    # Fix React imports
    sed -i 's/from '\''react\.js'\''/from '\''react'\''/g' "$file"
    sed -i 's/from '\''ink\.js'\''/from '\''ink'\''/g' "$file"
    
    # Fix Node.js module imports
    sed -i 's/from '\''path\.js'\''/from '\''path'\''/g' "$file"
    sed -i 's/from '\''fs\/promises\.js'\''/from '\''fs\/promises'\''/g' "$file"
    sed -i 's/from '\''os\.js'\''/from '\''os'\''/g' "$file"
    sed -i 's/from '\''crypto\.js'\''/from '\''crypto'\''/g' "$file"
    sed -i 's/from '\''chalk\.js'\''/from '\''chalk'\''/g' "$file"
    sed -i 's/from '\''openai\.js'\''/from '\''openai'\''/g' "$file"
}

# Function to fix TypeScript/Jest assertion issues
fix_jest_assertions() {
    local file="$1"
    echo "Fixing Jest assertions in: $file"
    
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

# Function to create missing mock files
create_missing_mocks() {
    echo "Creating missing mock files..."
    
    # Create enhanced React mock
    mkdir -p test/mocks/stubs
    cat > test/mocks/stubs/react-enhanced-mock.js << 'EOF'
// Enhanced React mock for Jest testing
const React = {
  useState: jest.fn((initial) => [initial, jest.fn()]),
  useEffect: jest.fn((fn) => fn()),
  useCallback: jest.fn((fn) => fn),
  useRef: jest.fn((initial) => ({ current: initial })),
  useMemo: jest.fn((fn) => fn()),
  useContext: jest.fn(),
  createContext: jest.fn(() => ({ Provider: jest.fn(), Consumer: jest.fn() })),
  createElement: jest.fn(),
  Fragment: 'Fragment',
  version: '18.0.0'
};

module.exports = React;
EOF

    # Create enhanced Ink mock
    cat > test/mocks/stubs/ink-enhanced-mock.js << 'EOF'
// Enhanced Ink mock for Jest testing
const mockComponent = () => null;

module.exports = {
  Box: mockComponent,
  Text: mockComponent,
  Newline: mockComponent,
  useInput: jest.fn(),
  useApp: jest.fn(() => ({ exit: jest.fn() })),
  render: jest.fn()
};
EOF

    # Create FileStorage mock
    mkdir -p src/storage/local
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
      await fs.unlink(path.join(this.metadataDir, `${cid}.json`));
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
}

# Function to fix specific test files
fix_specific_tests() {
    echo "Fixing specific test files..."
    
    # Fix ModelSelector test
    if [[ -f "test/model_selector.test.tsx" ]]; then
        echo "Fixing ModelSelector test..."
        fix_import_paths "test/model_selector.test.tsx"
        fix_jest_assertions "test/model_selector.test.tsx"
        
        # Fix TypeScript types and mocking
        sed -i 's/(getGlobalConfig as jest\.Mock)\.mockReturnValue/getGlobalConfig.mockReturnValue/g' "test/model_selector.test.tsx"
        sed -i 's/(saveGlobalConfig as jest\.Mock)\.mockImplementation/saveGlobalConfig.mockImplementation/g' "test/model_selector.test.tsx"
        sed -i 's/(getSessionState as jest\.Mock)\.mockImplementation/getSessionState.mockImplementation/g' "test/model_selector.test.tsx"
        sed -i 's/(setSessionState as jest\.Mock)\.mockImplementation/setSessionState.mockImplementation/g' "test/model_selector.test.tsx"
    fi
    
    # Fix FibonacciHeap test
    if [[ -f "test/unit/tasks/fibonacci-heap.test.ts" ]]; then
        echo "Fixing FibonacciHeap test..."
        fix_import_paths "test/unit/tasks/fibonacci-heap.test.ts"
        fix_jest_assertions "test/unit/tasks/fibonacci-heap.test.ts"
    fi
    
    # Fix registry tests
    if [[ -f "test/unit/models/registry.test.ts" ]]; then
        echo "Fixing registry test..."
        fix_import_paths "test/unit/models/registry.test.ts"
        fix_jest_assertions "test/unit/models/registry.test.ts"
    fi
    
    # Fix simple storage test
    if [[ -f "test/simple-storage.test.js" ]]; then
        echo "Fixing simple storage test..."
        fix_import_paths "test/simple-storage.test.js"
        fix_jest_assertions "test/simple-storage.test.js"
    fi
}

# Function to run tests and capture results
run_tests_with_diagnostics() {
    echo "Running tests with diagnostics..."
    
    local test_results_dir="test-results-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$test_results_dir"
    
    # Test individual files
    local test_files=(
        "test/model_selector.test.tsx"
        "test/unit/tasks/fibonacci-heap.test.ts"
        "test/unit/models/registry.test.ts"
        "test/simple-storage.test.js"
        "test/basic.test.js"
        "test/ultra-minimal.test.js"
    )
    
    for test_file in "${test_files[@]}"; do
        if [[ -f "$test_file" ]]; then
            echo "Testing: $test_file"
            local test_name=$(basename "$test_file" .test.tsx)
            test_name=$(basename "$test_name" .test.ts)
            test_name=$(basename "$test_name" .test.js)
            
            NODE_OPTIONS=--experimental-vm-modules npx jest "$test_file" \
                --detectOpenHandles \
                --forceExit \
                --maxWorkers=1 \
                --no-cache \
                > "$test_results_dir/${test_name}-output.log" 2>&1 || true
        fi
    done
    
    # Generate summary report
    cat > "$test_results_dir/summary.md" << EOF
# Test Results Summary - $(date)

## Test Files Processed:
$(for test_file in "${test_files[@]}"; do
    if [[ -f "$test_file" ]]; then
        echo "- $test_file"
    fi
done)

## Results:
$(for test_file in "${test_files[@]}"; do
    if [[ -f "$test_file" ]]; then
        test_name=$(basename "$test_file" .test.tsx)
        test_name=$(basename "$test_name" .test.ts)
        test_name=$(basename "$test_name" .test.js)
        
        if grep -q "PASS" "$test_results_dir/${test_name}-output.log" 2>/dev/null; then
            echo "✅ $test_file - PASSED"
        elif grep -q "FAIL" "$test_results_dir/${test_name}-output.log" 2>/dev/null; then
            echo "❌ $test_file - FAILED"
        else
            echo "⚠️ $test_file - ERROR/UNKNOWN"
        fi
    fi
done)

## Detailed Logs:
Check individual log files in this directory for detailed error information.
EOF

    echo "Test results saved to: $test_results_dir"
    cat "$test_results_dir/summary.md"
}

# Main execution
echo "Step 1: Creating missing mock files..."
create_missing_mocks

echo "Step 2: Fixing import paths in all test files..."
find test -name "*.test.*" -type f | while read -r file; do
    fix_import_paths "$file"
done

find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read -r file; do
    fix_import_paths "$file"
done

echo "Step 3: Fixing Jest assertions..."
find test -name "*.test.*" -type f | while read -r file; do
    fix_jest_assertions "$file"
done

echo "Step 4: Fixing specific test files..."
fix_specific_tests

echo "Step 5: Running tests with diagnostics..."
run_tests_with_diagnostics

echo "============================================"
echo "Test fixing completed!"
echo "============================================"
