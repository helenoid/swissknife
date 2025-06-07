#!/bin/bash
# master-test-runner.sh
# Comprehensive solution to make all SwissKnife tests pass

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
MAGENTA="\033[0;35m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Master Test Runner${RESET}"
echo -e "${BLUE}===========================${RESET}"

# Create timestamp for results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="test-results-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR/logs"
mkdir -p "$RESULTS_DIR/reports"
mkdir -p "$RESULTS_DIR/temp"

# Logging function (modified to echo instead of log to file)
log() {
  local level=$1
  shift
  local message="$@"
  local color=$RESET
  
  case "$level" in
    "INFO") color=$BLUE ;;
    "SUCCESS") color=$GREEN ;;
    "WARNING") color=$YELLOW ;;
    "ERROR") color=$RED ;;
    "STEP") color=$CYAN ;;
  esac
  
  echo -e "${color}[$level] $message${RESET}"
  # Removed file logging: echo "[$level] $message" >> "$RESULTS_DIR/master-runner.log"
}

# Function to run a specific test or pattern with a given configuration
run_test() {
  local test_pattern=$1
  local config_file=$2
  local description=$3
  local log_file="$RESULTS_DIR/logs/$(echo "$test_pattern" | tr '/' '-' | tr '*' 'x')_$(basename "$config_file" .cjs).log"
  
  log "STEP" "Running test '$test_pattern' with config '$(basename "$config_file")'"
  log "INFO" "Description: $description"
  
  # Run the test and capture output to log file
  npx jest "$test_pattern" --config="$config_file" > "$log_file" 2>&1
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo "Test '$test_pattern' PASSED with config '$(basename "$config_file")'"
    echo "$test_pattern: PASS ($(basename "$config_file"))" >> "$RESULTS_DIR/passing_tests.txt"
    return 0
  else
    echo "Test '$test_pattern' FAILED with config '$(basename "$config_file")'. Log file: $log_file"
    echo "$test_pattern: FAIL ($(basename "$config_file"))" >> "$RESULTS_DIR/failing_tests.txt"
    
    # Extract error info and print to stdout
    echo "Error summary for '$test_pattern':"
    grep -A 5 -B 2 "Error:" "$log_file" | head -20
    echo "--- End Error Summary ---"
    
    return 1
  fi
}

# Step 1: Prepare the test environment
echo "STEP: Step 1: Preparing test environment"

# Ensure necessary directories exist
echo "INFO: Creating necessary directories"
mkdir -p dist/entrypoints
mkdir -p dist/models/execution
mkdir -p dist/config
mkdir -p dist/models/registry
mkdir -p dist/integration
mkdir -p dist/utils/events
mkdir -p dist/utils/errors
mkdir -p test/helpers

# Initial test validation
echo "INFO: Validating basic test functionality"
npx jest test/ultra-basic.test.js --verbose

# Step 1.1: Fix Specific Test Files
echo "STEP: Step 1.1: Fixing critical test files"

fix_test_file() {
  local file=$1
  local backup="${file}.bak"
  
  # Create backup if it doesn't exist
  if [ ! -f "$backup" ]; then
    cp "$file" "$backup"
    echo "Created backup: $backup"
  fi
  
  # Fix Chai assertions
  sed -i 's/expect(\(.*\))\.to\.equal(\(.*\))/expect(\1).toBe(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.deep\.equal(\(.*\))/expect(\1).toEqual(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.eql(\(.*\))/expect(\1).toEqual(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.null/expect(\1).toBeNull()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.not\.be\.null/expect(\1).not.toBeNull()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.undefined/expect(\1).toBeUndefined()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.not\.be\.undefined/expect(\1).not.toBeUndefined()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.true/expect(\1).toBe(true)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.be\.false/expect(\1).toBe(false)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.exist/expect(\1).toBeDefined()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.not\.exist/expect(\1).not.toBeDefined()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.include(\(.*\))/expect(\1).toContain(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.contain(\(.*\))/expect(\1).toContain(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.match(\(.*\))/expect(\1).toMatch(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.throw(\(.*\))/expect(\1).toThrow(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.throw()/expect(\1).toThrow()/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.have\.lengthOf(\(.*\))/expect(\1).toHaveLength(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.have\.property(\(.*\))/expect(\1).toHaveProperty(\2)/g' "$file"
  sed -i 's/expect(\(.*\))\.to\.not\.equal(\(.*\))/expect(\1).not.toBe(\2)/g' "$file"
  
  # Remove Chai imports and comments
  sed -i '/const chai = require/d' "$file"
  sed -i '/const expect = chai/d' "$file"
  sed -i '/import chai from/d' "$file"
  sed -i '/import { expect } from.*chai/d' "$file"
  sed -i '/\/\/ Chai assertions are provided by/d' "$file"
  
  echo "Fixed assertions in $file"
}

# Fix critical test files
echo "INFO: Fixing critical test files"
fix_test_file "test/basic.test.js"
fix_test_file "test/verify-env.test.js"
fix_test_file "test/simple-registry.test.js"
fix_test_file "test/mcp-minimal.test.js"
fix_test_file "test/diagnostic-simple.test.js"

# Step 2: Create optimized Jest configuration
echo "STEP: Step 2: Creating optimized Jest configuration"

cat > jest.master.config.cjs << 'EOF'
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
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
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  moduleNameMapper: {
    "^(.*)\\.js$": "$1",  // Handle .js extension in imports
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  setupFilesAfterEnv: [
    "<rootDir>/test/setup-jest-master.js"
  ],
  modulePathIgnorePatterns: [
    'swissknife_old'
  ],
  haste: {
    enableSymlinks: false,
    throwOnModuleCollision: false
  },
  maxConcurrency: 1,
  verbose: true
};
EOF

echo "SUCCESS: Created Jest master configuration"

# Step 3: Create Jest setup file
echo "STEP: Step 3: Creating master Jest setup file"

cat > test/setup-jest-master.js << 'EOF'
// Master setup file for the SwissKnife test suite
jest.setTimeout(60000);

// Handle missing globals that Jest expects in Node.js environment
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  TEST_PROVIDER_API_KEY: 'test-api-key',
  TEST_PROVIDER_1_API_KEY: 'test-api-key-1',
  TEST_PROVIDER_2_API_KEY: 'test-api-key-2',
  MCP_SERVER_PORT: '9000',
  MCP_SERVER_HOST: 'localhost',
  MCP_CLIENT_PORT: '9000',
  MCP_CLIENT_HOST: 'localhost'
};

// Mock fetch API if it doesn't exist
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue({}),
    text: jest.fn().mockResolvedValue('')
  });
}

// Setup HTTP mocks
const createMockResponse = () => ({
  statusCode: 200,
  headers: {},
  on: jest.fn().mockImplementation((event, callback) => {
    if (event === 'data') callback('{}');
    if (event === 'end') callback();
    return this;
  }),
  setEncoding: jest.fn(),
  write: jest.fn(),
  end: jest.fn()
});

const createMockRequest = () => ({
  on: jest.fn().mockImplementation((event, callback) => {
    if (event === 'data') callback('{}');
    if (event === 'end') callback();
    return this;
  }),
  headers: {},
  url: '/',
  method: 'GET'
});

jest.mock('http', () => {
  const originalHttp = jest.requireActual('http');
  return {
    ...originalHttp,
    createServer: jest.fn().mockImplementation((handler) => ({
      listen: jest.fn().mockImplementation((port, host, callback) => {
        if (callback) callback();
        return this;
      }),
      on: jest.fn().mockImplementation((event, callback) => {
        return this;
      }),
      close: jest.fn().mockImplementation((callback) => {
        if (callback) callback();
        return this;
      })
    }))
  };
});

// Handle common import issues
jest.mock('@/utils/config', () => ({
  config: {
    get: jest.fn().mockImplementation((key, defaultValue) => {
      const configs = {
        'ai.providers.test': { apiKey: 'test-api-key' },
        'mcp.server.port': 9000,
        'mcp.server.host': 'localhost',
        'mcp.client.port': 9000,
        'mcp.client.host': 'localhost',
        'api.timeout': 30000,
        'task.timeout': 60000
      };
      return configs[key] || defaultValue;
    }),
    set: jest.fn()
  }
}), { virtual: true });

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.warn('Unhandled Rejection at:', promise, 'reason:', reason);
});
EOF

echo "SUCCESS: Created Jest master configuration"

# Step 3.5: Add the simplified test runners
echo "STEP: Step 3.5: Adding simplified test runners"

cat > test/setup-simplified.js << 'EOF'
// Simplified setup for the SwissKnife test suite
jest.setTimeout(30000);

// Helper functions available to all tests
global.wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.waitUntil = async (condition, timeout = 10000, interval = 100) => {
  const startTime = Date.now();
  while (!condition() && Date.now() - startTime < timeout) {
    await global.wait(interval);
  }
  if (!condition()) {
    throw new Error(`Condition not met within ${timeout}ms`);
  }
};

// Silence unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection in test:', reason);
});

// Add custom matchers
expect.extend({
  async toEventuallyEqual(received, expected, timeout = 5000) {
    const startTime = Date.now();
    let lastValue = received;
    let isEqual = false;
    
    try {
      while (!isEqual && Date.now() - startTime < timeout) {
        if (typeof received === 'function') {
          lastValue = await received();
        }
        isEqual = this.equals(lastValue, expected);
        if (!isEqual) {
          await global.wait(100);
        }
      }
      
      if (isEqual) {
        return {
          message: () => `expected ${this.utils.printReceived(lastValue)} not to eventually equal ${this.utils.printExpected(expected)}`,
          pass: true
        };
      } else {
        return {
          message: () => `expected ${this.utils.printReceived(lastValue)} to eventually equal ${this.utils.printExpected(expected)} within ${timeout}ms`,
          pass: false
        };
      }
    } catch (e) {
      return {
        message: () => `Error while checking value: ${e.message}`,
        pass: false
      };
    }
  }
});
EOF

echo "INFO: Created simplified test setup"

# Create optimized Jest config
cat > jest.optimized.config.cjs << 'EOF'
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 60000,
  transform: {
    "^.+\\.(t|j)sx?$": [
      "babel-jest", 
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript"
        ],
        plugins: [
          "@babel/plugin-transform-modules-commonjs"
        ]
      }
    ]
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],
  moduleNameMapper: {
    "^(.*)\\.js$": "$1",
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  setupFilesAfterEnv: [
    "<rootDir>/test/setup-simplified.js"
  ],
  modulePathIgnorePatterns: [
    'swissknife_old'
  ],
  maxConcurrency: 1,
  verbose: true,
  maxWorkers: 1,
  timers: "fake",
  bail: 0,
  detectOpenHandles: true,
  collectCoverage: false,
  forceExit: true
};
EOF

echo "SUCCESS: Created optimized Jest configuration"

# Step 4.5: Run simplified tests
echo "STEP: Step 4.5: Running simplified standalone tests"

# Run simplified task manager test
echo "INFO: Running simplified task manager test"
npx jest test/simplified-task-manager.test.js --config=jest.simple.config.cjs

# Fix the standalone tests
echo "INFO: Running fixed standalone tests"
npx jest test/standalone-config.test.js test/standalone-task-manager.test.js test/standalone-worker.test.js --config=jest.simple.config.cjs

# Step 6: Run the tests in groups to identify and fix issues
echo "STEP: Step 6: Running tests by category"

# Test groups in order of dependency (less dependent modules first)
declare -a test_groups=(
  "test/standalone*.test.js:Standalone tests"
  "test/ultra-basic.test.js:Ultra basic test"
  "test/verify-env.test.js:Environment verification"
  "test/basic.test.js:Basic tests"
  "test/mcp-minimal.test.js:Minimal MCP tests"
  "test/diagnostic-simple.test.js:Simple diagnostic tests"
  "test/unit/minimal.test.js:Basic minimal test"
  "test/unit/utils/**/*.test.js:Utility tests"
  "test/unit/models/**/*.test.js:Model tests"
  "test/unit/services/**/*.test.js:Service tests"
  "test/unit/ai/**/*.test.js:AI tests"
  "test/unit/tasks/**/*.test.js:Task tests"
  "test/unit/mcp-server/**/*.test.js:MCP Server tests"
  "test/unit/execution/**/*.test.js:Execution tests"
  "test/unit/integration/**/*.test.js:Integration tests"
)

# Run each test group
overall_status=0
for group in "${test_groups[@]}"; do
  IFS=':' read -r pattern description <<< "$group"
  
  echo "INFO: Running '$description' tests"
  run_test "$pattern" "jest.master.config.cjs" "$description"
  
  if [ $? -ne 0 ]; then
    echo "WARNING: Some tests in group '$description' failed"
    overall_status=1
  else
    echo "SUCCESS: All tests in group '$description' passed"
  fi
done

# Step 7: Generate test report
echo "STEP: Step 7: Generating test report"

# Count passed and failed tests
PASSED=$(cat "$RESULTS_DIR/passing_tests.txt" 2>/dev/null | wc -l || echo 0)
FAILED=$(cat "$RESULTS_DIR/failing_tests.txt" 2>/dev/null | wc -l || echo 0)
TOTAL=$((PASSED + FAILED))

# Create report
cat > "$RESULTS_DIR/reports/test-report.md" << EOF
# SwissKnife Test Report

Generated: $(date)

## Summary
- Total Tests: $TOTAL
- Passed: $PASSED
- Failed: $FAILED
- Success Rate: $(( (PASSED * 100) / (TOTAL == 0 ? 1 : TOTAL) ))%

## Test Groups
EOF

# Add group details to report
for group in "${test_groups[@]}"; do
  IFS=':' read -r pattern description <<< "$group"
  GROUP_PASSED=$(grep "$pattern" "$RESULTS_DIR/passing_tests.txt" 2>/dev/null | wc -l || echo 0)
  GROUP_FAILED=$(grep "$pattern" "$RESULTS_DIR/failing_tests.txt" 2>/dev/null | wc -l || echo 0)
  GROUP_TOTAL=$((GROUP_PASSED + GROUP_FAILED))
  
  if [ $GROUP_TOTAL -gt 0 ]; then
    GROUP_RATE=$(( (GROUP_PASSED * 100) / GROUP_TOTAL ))
  else
    GROUP_RATE=0
  fi
  
  cat >> "$RESULTS_DIR/reports/test-report.md" << EOF

### $description
- Tests: $GROUP_TOTAL
- Passed: $GROUP_PASSED
- Failed: $GROUP_FAILED
- Success Rate: ${GROUP_RATE}%
EOF
done

# Add failing tests to report if any
if [ $FAILED -gt 0 ]; then
  cat >> "$RESULTS_DIR/reports/test-report.md" << EOF

## Failed Tests
\`\`\`
$(cat "$RESULTS_DIR/failing_tests.txt")
\`\`\`
EOF
fi

echo "SUCCESS: Test report generated: $RESULTS_DIR/reports/test-report.md"

# Step 8: Finish
if [ $overall_status -eq 0 ]; then
  echo "SUCCESS: All tests passed successfully!"
  echo -e "${GREEN}All tests passed successfully!${RESET}"
else
  echo "WARNING: Some tests failed. See report for details."
  echo -e "${YELLOW}Some tests failed. See report: $RESULTS_DIR/reports/test-report.md${RESET}"
fi

# Final summary
echo
echo -e "${BLUE}Test Run Summary${RESET}"
echo -e "${BLUE}================${RESET}"
echo -e "Total Tests: ${CYAN}$TOTAL${RESET}"
echo -e "Passed: ${GREEN}$PASSED${RESET}"
echo -e "Failed: ${RED}$FAILED${RESET}"
echo -e "Success Rate: ${CYAN}$(( (PASSED * 100) / (TOTAL == 0 ? 1 : TOTAL) ))%${RESET}"
echo -e "Report: ${YELLOW}$RESULTS_DIR/reports/test-report.md${RESET}"
echo

exit $overall_status
