#!/bin/bash
# Comprehensive test diagnostic and fix script

set -e

echo "🔍 SwissKnife Test Diagnostic and Fix"
echo "===================================="

# Create results directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="./test-results-${TIMESTAMP}"
mkdir -p "$RESULTS_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$RESULTS_DIR/diagnostic.log"
}

# Function to run a test with detailed error capture
run_single_test() {
    local test_file="$1"
    local test_name=$(basename "$test_file")
    local output_file="$RESULTS_DIR/${test_name}.output"
    
    log "Testing: $test_file"
    
    # Try to run the test and capture all output
    if npx jest "$test_file" --verbose --no-cache 2>&1 | tee "$output_file"; then
        log "✅ PASS: $test_name"
        echo "$test_file" >> "$RESULTS_DIR/passing.txt"
        return 0
    else
        log "❌ FAIL: $test_name"
        echo "$test_file" >> "$RESULTS_DIR/failing.txt"
        
        # Extract error details
        echo "Error details for $test_file:" >> "$RESULTS_DIR/error_details.txt"
        grep -A 5 -B 5 "Error\|FAIL\|TypeError\|ReferenceError\|SyntaxError" "$output_file" >> "$RESULTS_DIR/error_details.txt"
        echo "---" >> "$RESULTS_DIR/error_details.txt"
        
        return 1
    fi
}

# Step 1: Check environment
log "Step 1: Environment Check"
log "Node version: $(node --version)"
log "Jest version: $(npx jest --version)"
log "NPM version: $(npm --version)"

# Step 2: Create and test minimal test
log "Step 2: Testing minimal configuration"
cat > "$RESULTS_DIR/minimal-test.js" << 'EOF'
test('minimal test', () => {
  expect(1 + 1).toBe(2);
});
EOF

if npx jest "$RESULTS_DIR/minimal-test.js" --testMatch="**/*minimal-test.js" 2>&1 | tee "$RESULTS_DIR/minimal-test.output"; then
    log "✅ Minimal test passes - Jest works"
else
    log "❌ Minimal test fails - Jest configuration issue"
    
    # Try with different configs
    log "Trying different Jest configurations..."
    
    # Create minimal config
    cat > "$RESULTS_DIR/minimal.config.js" << 'EOF'
module.exports = {
  testEnvironment: 'node',
  verbose: true
};
EOF
    
    if npx jest "$RESULTS_DIR/minimal-test.js" --config="$RESULTS_DIR/minimal.config.js" 2>&1 | tee "$RESULTS_DIR/minimal-with-config.output"; then
        log "✅ Minimal test with custom config passes"
        WORKING_CONFIG="$RESULTS_DIR/minimal.config.js"
    else
        log "❌ Even minimal config fails - serious Jest issue"
        exit 1
    fi
fi

# Step 3: Test sample of real test files
log "Step 3: Testing sample of real test files"

# Get a representative sample of test files
sample_tests=(
    "test/environment-verification.test.js"
    "test/basic.test.js"
    "test/unit/models/registry-revised.test.ts"
    "test/unit/storage/storage.test.ts"
    "test/fibonacci-sanity.test.ts"
)

passed_count=0
failed_count=0

for test_file in "${sample_tests[@]}"; do
    if [ -f "$test_file" ]; then
        if run_single_test "$test_file"; then
            ((passed_count++))
        else
            ((failed_count++))
        fi
    else
        log "⚠️  Test file not found: $test_file"
    fi
done

log "Sample test results: $passed_count passed, $failed_count failed"

# Step 4: Run all tests and categorize errors
log "Step 4: Running comprehensive test analysis"

# Get all test files
mapfile -t all_tests < <(npx jest --listTests 2>/dev/null | head -20)

log "Found ${#all_tests[@]} test files to analyze"

# Test each file individually
for test_file in "${all_tests[@]}"; do
    if [ -n "$test_file" ] && [ -f "$test_file" ]; then
        run_single_test "$test_file"
    fi
done

# Step 5: Analyze errors and create fixes
log "Step 5: Analyzing errors and creating fixes"

if [ -f "$RESULTS_DIR/error_details.txt" ]; then
    log "Analyzing error patterns..."
    
    # Common error patterns
    declare -A error_patterns=(
        ["Cannot find module"]="MODULE_NOT_FOUND"
        ["TypeError: Cannot read"]="UNDEFINED_PROPERTY"
        ["ReferenceError:"]="UNDEFINED_VARIABLE"
        ["SyntaxError:"]="SYNTAX_ERROR"
        ["import.*from"]="ESM_IMPORT_ERROR"
        ["require.*is not a function"]="REQUIRE_ERROR"
        ["Haste module naming collision"]="HASTE_COLLISION"
    )
    
    for pattern in "${!error_patterns[@]}"; do
        count=$(grep -c "$pattern" "$RESULTS_DIR/error_details.txt" 2>/dev/null || echo 0)
        if [ "$count" -gt 0 ]; then
            log "Found $count instances of ${error_patterns[$pattern]}: $pattern"
            echo "${error_patterns[$pattern]}: $count instances" >> "$RESULTS_DIR/error_summary.txt"
        fi
    done
fi

# Step 6: Create targeted fixes
log "Step 6: Creating targeted fixes"

# Fix 1: Module resolution issues
log "Creating module resolution fixes..."
cat > "$RESULTS_DIR/fix-module-imports.sh" << 'EOF'
#!/bin/bash
# Fix common module import issues

echo "Fixing module import issues..."

# Fix relative imports in test files
find test -name "*.test.ts" -o -name "*.test.js" | while read file; do
    # Fix common import patterns
    sed -i 's|from "\.\./\.\./js"|from "../../src"|g' "$file"
    sed -i 's|from "\.\./\.\."|from "../../src"|g' "$file"
    sed -i 's|import \* as|import|g' "$file"
done

echo "Module import fixes applied"
EOF

chmod +x "$RESULTS_DIR/fix-module-imports.sh"

# Fix 2: Jest configuration
log "Creating Jest configuration fix..."
cat > "$RESULTS_DIR/jest-fixed.config.js" << 'EOF'
module.exports = {
  testEnvironment: 'node',
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^~/(.*)$': '<rootDir>/$1',
  },
  
  // Transform files
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/test/jest-setup.js'
  ],
  
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.(js|jsx|ts|tsx)',
    '**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
  
  // Timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // Clear mocks
  clearMocks: true,
  
  // Reset modules
  resetModules: true
};
EOF

# Fix 3: Create universal Jest setup
log "Creating universal Jest setup..."
cat > "$RESULTS_DIR/jest-setup.js" << 'EOF'
// Universal Jest setup file

// Global test utilities
global.testUtils = {
  createMock: (returnValue) => jest.fn(() => returnValue),
  createAsyncMock: (returnValue) => jest.fn(async () => returnValue),
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Console mock for cleaner test output
if (process.env.NODE_ENV === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: console.warn,
    error: console.error,
  };
}

// Increase timeout for slow tests
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});
EOF

# Step 7: Create test runner script
log "Creating test runner script..."
cat > "$RESULTS_DIR/run-fixed-tests.sh" << 'EOF'
#!/bin/bash

echo "Running tests with fixed configuration..."

# Apply fixes first
if [ -f "./fix-module-imports.sh" ]; then
    ./fix-module-imports.sh
fi

# Run tests with fixed config
npx jest --config="./jest-fixed.config.js" "$@"
EOF

chmod +x "$RESULTS_DIR/run-fixed-tests.sh"

# Step 8: Generate comprehensive report
log "Generating comprehensive report..."
cat > "$RESULTS_DIR/test-report.md" << EOF
# SwissKnife Test Diagnostic Report
Generated: $(date)

## Environment
- Node.js: $(node --version)
- Jest: $(npx jest --version)
- Results Directory: $RESULTS_DIR

## Test Results Summary
- Total tests analyzed: ${#all_tests[@]}
- Tests passed: $passed_count
- Tests failed: $failed_count

## Failing Tests
$(if [ -f "$RESULTS_DIR/failing.txt" ]; then cat "$RESULTS_DIR/failing.txt" | sed 's/^/- /'; else echo "None"; fi)

## Passing Tests
$(if [ -f "$RESULTS_DIR/passing.txt" ]; then cat "$RESULTS_DIR/passing.txt" | sed 's/^/- /'; else echo "None"; fi)

## Error Patterns
$(if [ -f "$RESULTS_DIR/error_summary.txt" ]; then cat "$RESULTS_DIR/error_summary.txt" | sed 's/^/- /'; else echo "No error patterns detected"; fi)

## Recommended Actions
1. Run the fix script: \`$RESULTS_DIR/fix-module-imports.sh\`
2. Use the fixed Jest config: \`$RESULTS_DIR/jest-fixed.config.js\`
3. Copy the setup file: \`cp $RESULTS_DIR/jest-setup.js test/\`
4. Run tests: \`$RESULTS_DIR/run-fixed-tests.sh\`

## Files Created
- Fixed Jest config: \`$RESULTS_DIR/jest-fixed.config.js\`
- Jest setup file: \`$RESULTS_DIR/jest-setup.js\`
- Module import fixer: \`$RESULTS_DIR/fix-module-imports.sh\`
- Test runner: \`$RESULTS_DIR/run-fixed-tests.sh\`
- Detailed logs: \`$RESULTS_DIR/diagnostic.log\`

EOF

log "✅ Diagnostic complete!"
log "📊 Report saved to: $RESULTS_DIR/test-report.md"
log "🔧 Fixes available in: $RESULTS_DIR/"
log ""
log "Next steps:"
log "1. Review the report: cat $RESULTS_DIR/test-report.md"
log "2. Apply fixes: $RESULTS_DIR/fix-module-imports.sh"
log "3. Run tests: $RESULTS_DIR/run-fixed-tests.sh"

echo ""
echo "🎯 Quick commands:"
echo "   View report: cat $RESULTS_DIR/test-report.md"
echo "   Apply fixes: $RESULTS_DIR/fix-module-imports.sh"
echo "   Run tests: $RESULTS_DIR/run-fixed-tests.sh"
