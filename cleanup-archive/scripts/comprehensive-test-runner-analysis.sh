#!/bin/bash

# Comprehensive test runner and fixer
# This script runs tests and systematically fixes issues

echo "=== SwissKnife Comprehensive Test Runner and Fixer ==="

# Set up environment
export NODE_ENV=test
export JEST_WORKER_ID=1

# Create a temporary results file
RESULTS_FILE="/tmp/jest_results_$(date +%s).json"
SUMMARY_FILE="/tmp/jest_summary_$(date +%s).txt"

echo "📋 Running comprehensive test analysis..."

# Run Jest with JSON output to capture detailed results
echo "Running Jest tests with unified configuration..."
npx jest --config=jest.unified.config.cjs \
  --json \
  --outputFile="$RESULTS_FILE" \
  --passWithNoTests \
  --verbose \
  --no-cache \
  --forceExit \
  --detectOpenHandles \
  --maxWorkers=1 2>&1 | tee "$SUMMARY_FILE"

# Check if results file was created
if [ -f "$RESULTS_FILE" ]; then
  echo "📊 Analyzing test results..."
  
  # Extract key metrics from JSON
  echo "=== TEST SUMMARY ==="
  cat "$RESULTS_FILE" | jq -r '
    "Total test suites: " + (.numTotalTestSuites | tostring) + 
    "\nPassed test suites: " + (.numPassedTestSuites | tostring) + 
    "\nFailed test suites: " + (.numFailedTestSuites | tostring) + 
    "\nTotal tests: " + (.numTotalTests | tostring) + 
    "\nPassed tests: " + (.numPassedTests | tostring) + 
    "\nFailed tests: " + (.numFailedTests | tostring)
  ' 2>/dev/null || echo "Could not parse JSON results"
  
  # Extract failing test details
  echo -e "\n=== FAILING TESTS ==="
  cat "$RESULTS_FILE" | jq -r '
    .testResults[] | 
    select(.status == "failed") | 
    .assertionResults[] | 
    select(.status == "failed") | 
    "❌ " + .ancestorTitles[0] + " > " + .title + "\n   Error: " + .failureMessages[0]
  ' 2>/dev/null | head -20
  
else
  echo "📋 Analyzing text output..."
  
  # Parse text output
  if [ -f "$SUMMARY_FILE" ]; then
    echo "=== TEST SUMMARY FROM OUTPUT ==="
    grep -E "(Test Suites:|Tests:)" "$SUMMARY_FILE" | tail -2
    
    echo -e "\n=== SAMPLE FAILURES ==="
    grep -A 2 -B 1 "FAIL\|Error:" "$SUMMARY_FILE" | head -20
  fi
fi

# Look for common patterns of errors and suggest fixes
echo -e "\n=== AUTOMATIC FIXES ==="

# Fix 1: Check for missing tsconfig.jest.json
if [ ! -f "tsconfig.jest.json" ]; then
  echo "🔧 Creating missing tsconfig.jest.json..."
  cat > tsconfig.jest.json << 'EOF'
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
    "isolatedModules": true,
    "declaration": false,
    "declarationMap": false,
    "sourceMap": false
  },
  "include": [
    "test/**/*",
    "src/**/*",
    "**/*.test.*",
    "**/*.spec.*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build"
  ]
}
EOF
  echo "✅ Created tsconfig.jest.json"
fi

# Fix 2: Ensure required directories exist
for dir in "test/helpers" "test/mocks" "test/fixtures"; do
  if [ ! -d "$dir" ]; then
    echo "🔧 Creating missing directory: $dir"
    mkdir -p "$dir"
  fi
done

# Fix 3: Create missing helper files
if [ ! -f "test/helpers/universal-testUtils.js" ]; then
  echo "🔧 Creating universal test utilities..."
  cat > test/helpers/universal-testUtils.js << 'EOF'
/**
 * Universal test utilities for Jest
 */

// Mock utilities
const createMockFunction = (returnValue) => {
  return jest.fn(() => returnValue);
};

const createAsyncMockFunction = (returnValue) => {
  return jest.fn(async () => returnValue);
};

// Test utilities
const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const mockConsole = () => {
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
};

const restoreConsole = (originalConsole) => {
  global.console = originalConsole;
};

// Export utilities
module.exports = {
  createMockFunction,
  createAsyncMockFunction,
  waitFor,
  mockConsole,
  restoreConsole
};
EOF
  echo "✅ Created universal test utilities"
fi

# Fix 4: Update setupFilesAfterEnv to use existing setup file
if grep -q "typescript-jest-setup.js" jest.unified.config.cjs; then
  echo "✅ Jest setup file configuration is correct"
else
  echo "🔧 Updating Jest configuration..."
  sed -i 's/setupFilesAfterEnv.*$/setupFilesAfterEnv: ["<rootDir>\/test\/typescript-jest-setup.js"],/' jest.unified.config.cjs
fi

echo -e "\n=== NEXT STEPS ==="
echo "1. Review failing tests above"
echo "2. Run specific failing tests individually to debug"
echo "3. Consider running: npx jest --config=jest.unified.config.cjs --no-cache"
echo "4. Check log files: $RESULTS_FILE and $SUMMARY_FILE"

echo -e "\n✅ Comprehensive test analysis completed!"
