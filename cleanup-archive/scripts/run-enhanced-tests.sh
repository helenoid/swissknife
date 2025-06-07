#!/bin/bash
# Enhanced test runner script for SwissKnife
# This script provides diagnostics and attempts to run tests with various configurations

# Set up colors
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

# Create a results directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="./test-results-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR/configs"
mkdir -p "$RESULTS_DIR/logs"

echo -e "${BLUE}SwissKnife Enhanced Test Runner${RESET}"
echo "==============================="
echo -e "Results will be saved to: ${YELLOW}$RESULTS_DIR${RESET}"
echo ""

# Helper function for running tests with different configs
run_test_with_config() {
  local test_file=$1
  local config_name=$2
  local config_content=$3
  local test_name=$(basename "$test_file" | sed 's/\./-/g')
  local config_file="$RESULTS_DIR/configs/$config_name.js"
  local log_file="$RESULTS_DIR/logs/${test_name}_${config_name}.log"
  
  # Create the config file
  echo "$config_content" > "$config_file"
  
  echo -e "${YELLOW}Running $test_file with $config_name config...${RESET}"
  
  # Run the test
  npx jest "$test_file" --config="$config_file" --no-cache > "$log_file" 2>&1
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✅ Test passed!${RESET}"
    echo "$test_file: PASS ($config_name)" >> "$RESULTS_DIR/passing.txt"
    return 0
  else
    echo -e "${RED}❌ Test failed.${RESET}"
    echo "$test_file: FAIL ($config_name)" >> "$RESULTS_DIR/failing.txt"
    echo -e "See log: $log_file"
    return 1
  fi
}

# Step 1: Define test configurations
echo -e "${BLUE}Step 1: Setting up test configurations${RESET}"

# Minimal configuration
MINIMAL_CONFIG=$(cat << 'EOF'
module.exports = {
  testEnvironment: 'node',
  verbose: true
};
EOF
)

# Basic ESM configuration
ESM_CONFIG=$(cat << 'EOF'
module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript"
      ],
      plugins: ["@babel/plugin-transform-modules-commonjs"]
    }]
  },
  moduleNameMapper: {
    "^(.*)\\.js$": "$1"
  },
  verbose: true
};
EOF
)

# Advanced configuration with haste fixes
ADVANCED_CONFIG=$(cat << 'EOF'
module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript"
      ],
      plugins: ["@babel/plugin-transform-modules-commonjs"]
    }]
  },
  moduleNameMapper: {
    "^(.*)\\.js$": "$1"
  },
  haste: {
    providesModuleNodeModules: [],
    hasteImplModulePath: null
  },
  modulePathIgnorePatterns: [
    "<rootDir>/dist/",
    "<rootDir>/swissknife_old/"
  ],
  testTimeout: 30000,
  verbose: true
};
EOF
)

echo -e "${GREEN}Test configurations created.${RESET}"

# Step 2: Create a simple diagnostic test
echo -e "\n${BLUE}Step 2: Creating diagnostic test${RESET}"

DIAGNOSTIC_TEST="$RESULTS_DIR/diagnostic.test.js"
cat > "$DIAGNOSTIC_TEST" << 'EOF'
/**
 * Diagnostic test for SwissKnife project
 */
test('Basic test - environment is working', () => {
  expect(true).toBe(true);
});
EOF

echo -e "${GREEN}Diagnostic test created at $DIAGNOSTIC_TEST${RESET}"

# Step 3: Run diagnostic test with different configurations
echo -e "\n${BLUE}Step 3: Running diagnostic test${RESET}"

run_test_with_config "$DIAGNOSTIC_TEST" "minimal" "$MINIMAL_CONFIG"
run_test_with_config "$DIAGNOSTIC_TEST" "esm" "$ESM_CONFIG"
run_test_with_config "$DIAGNOSTIC_TEST" "advanced" "$ADVANCED_CONFIG"

# Step 4: Run actual tests with the best configuration
echo -e "\n${BLUE}Step 4: Testing project files${RESET}"

# Try to determine best config from diagnostic results
if grep -q "$DIAGNOSTIC_TEST: PASS (advanced)" "$RESULTS_DIR/passing.txt" 2>/dev/null; then
  BEST_CONFIG="$ADVANCED_CONFIG"
  BEST_CONFIG_NAME="advanced"
elif grep -q "$DIAGNOSTIC_TEST: PASS (esm)" "$RESULTS_DIR/passing.txt" 2>/dev/null; then
  BEST_CONFIG="$ESM_CONFIG"
  BEST_CONFIG_NAME="esm"
elif grep -q "$DIAGNOSTIC_TEST: PASS (minimal)" "$RESULTS_DIR/passing.txt" 2>/dev/null; then
  BEST_CONFIG="$MINIMAL_CONFIG"
  BEST_CONFIG_NAME="minimal"
else
  echo -e "${RED}No working configuration found. Using advanced as fallback.${RESET}"
  BEST_CONFIG="$ADVANCED_CONFIG"
  BEST_CONFIG_NAME="advanced"
fi

echo -e "${YELLOW}Using $BEST_CONFIG_NAME configuration for project tests${RESET}"

# List of key tests to run
TEST_FILES=(
  "test/super-minimal.test.js"
  "test/unit/models/registry.test.ts"
  "test/unit/storage/storage.test.ts"
  "test/unit/commands/help-generator.test.ts"
  "test/unit/tasks/fibonacci-heap.test.ts"
)

# Run each test with the best configuration
for test_file in "${TEST_FILES[@]}"; do
  if [ -f "$test_file" ]; then
    run_test_with_config "$test_file" "$BEST_CONFIG_NAME" "$BEST_CONFIG"
  else
    echo -e "${YELLOW}Test file not found: $test_file${RESET}"
  fi
done

# Step 5: Generate test report
echo -e "\n${BLUE}Step 5: Generating test report${RESET}"

REPORT_FILE="$RESULTS_DIR/test_report.md"

cat > "$REPORT_FILE" << EOF
# SwissKnife Test Report
Generated: $(date)

## Environment
- Node.js version: $(node -v)
- npm version: $(npm -v)
- Jest version: $(npx jest --version 2>/dev/null || echo "Unknown")

## Configuration
Best working configuration: $BEST_CONFIG_NAME

## Test Results

### Passing Tests
$(if [ -f "$RESULTS_DIR/passing.txt" ]; then cat "$RESULTS_DIR/passing.txt" | sed 's/^/- /'; else echo "None"; fi)

### Failing Tests
$(if [ -f "$RESULTS_DIR/failing.txt" ]; then cat "$RESULTS_DIR/failing.txt" | sed 's/^/- /'; else echo "None"; fi)

## Analysis
The testing environment in SwissKnife has several challenges:

1. Module format conflicts between ESM and CommonJS
2. Jest configuration issues, particularly with the Haste system
3. TypeScript configuration needs adjustment for proper path resolution
4. Mocking issues with ES modules

## Recommendations
Based on the test results, we recommend the following actions:

1. Standardize on a single module format across the codebase
2. Use a single Jest configuration with proper ESM support
3. Fix import statements to include file extensions for ESM compatibility
4. Update mock implementations to work with the chosen module system
5. Consider moving to Vitest for better ESM support if continuing with ESM

## Next Steps
To fix failing tests:
1. For each failing test, check the corresponding log file for specific errors
2. Address module import issues by adding .js extensions to all imports
3. Update mock implementations to use the correct module format
4. Consider creating type-only imports for TypeScript interfaces

EOF

echo -e "${GREEN}Test report generated: $REPORT_FILE${RESET}"

# Step 6: Create reusable test runner
echo -e "\n${BLUE}Step 6: Creating reusable test runner${RESET}"

TEST_RUNNER_SCRIPT="./run-tests-with-best-config.sh"

cat > "$TEST_RUNNER_SCRIPT" << EOF
#!/bin/bash
# Run tests with the best working configuration

# Get test path from command line
TEST_PATH=\${1:-"test"}

# Use the best working configuration
CONFIG_FILE="$RESULTS_DIR/configs/$BEST_CONFIG_NAME.js"

echo "Running tests: \$TEST_PATH"
echo "Using configuration: $BEST_CONFIG_NAME"
echo ""

# Run the tests
npx jest "\$TEST_PATH" --config="\$CONFIG_FILE" --verbose "\$@"
EOF

chmod +x "$TEST_RUNNER_SCRIPT"

echo -e "${GREEN}Created test runner script: $TEST_RUNNER_SCRIPT${RESET}"
echo -e "You can run tests with: ${YELLOW}$TEST_RUNNER_SCRIPT <test-path>${RESET}"

echo -e "\n${BLUE}Enhanced Test Runner Complete!${RESET}"
echo -e "Test report: $REPORT_FILE"
