#!/bin/bash
# Improved diagnostic test runner for fixing remaining issues
# This will help us identify and fix failing tests systematically

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

RESULTS_FILE="improved-test-results.md"

# Ensure we create the results file
touch "$RESULTS_FILE"
echo "# Improved Test Diagnostic Results" > "$RESULTS_FILE"
echo "Run on: $(date)" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

# Function to run a test and capture its output
run_test() {
  local test_file="$1"
  local config="$2"
  local config_name="$3"
  
  echo -e "${YELLOW}Testing: $test_file (config: $config_name)${RESET}"
  echo -e "### $test_file ($config_name)" >> "$RESULTS_FILE"
  echo "\`\`\`" >> "$RESULTS_FILE"
  
  # Run the test and capture output and exit code
  output=$(npx jest "$test_file" --config="$config" 2>&1)
  exit_code=$?
  
  # Write output to results file
  echo "$output" >> "$RESULTS_FILE"
  
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED: $test_file${RESET}"
    echo -e "\n✅ PASSED\n" >> "$RESULTS_FILE"
  else
    echo -e "${RED}❌ FAILED: $test_file${RESET}"
    echo -e "\n❌ FAILED (exit code: $exit_code)\n" >> "$RESULTS_FILE"
  fi
  echo "\`\`\`" >> "$RESULTS_FILE"
  echo "" >> "$RESULTS_FILE"
  
  return $exit_code
}

# List of key test files to check
declare -a TEST_FILES=(
  "test/basic.test.js"
  "test/execution-service-isolated.test.js"
  "test/mcp-minimal.test.js"
  "test/super-minimal.test.js"
)

# Run tests with our super-minimal config
echo -e "${BLUE}Running key tests with super-minimal config...${RESET}"
echo -e "## Tests with super-minimal config" >> "$RESULTS_FILE"

for test_file in "${TEST_FILES[@]}"; do
  if [ -f "$test_file" ]; then
    run_test "$test_file" "jest-super-minimal.config.cjs" "super-minimal config"
  else
    echo -e "${RED}File not found: $test_file${RESET}"
    echo -e "### $test_file\n\n❌ FILE NOT FOUND\n" >> "$RESULTS_FILE"
  fi
done

# Try running with the unified config
echo -e "\n${BLUE}Running key tests with unified config...${RESET}"
echo -e "## Tests with unified config" >> "$RESULTS_FILE"

for test_file in "${TEST_FILES[@]}"; do
  if [ -f "$test_file" ]; then
    NODE_OPTIONS="--experimental-vm-modules" run_test "$test_file" "jest.unified.config.cjs" "unified config"
  else
    echo -e "${RED}File not found: $test_file${RESET}"
    echo -e "### $test_file\n\n❌ FILE NOT FOUND\n" >> "$RESULTS_FILE"
  fi
done

# Add some real module-specific tests
echo -e "\n${BLUE}Testing core modules with unified config...${RESET}"
echo -e "## Core Module Tests (unified config)" >> "$RESULTS_FILE"

# Define core module test files
declare -a CORE_TEST_FILES=(
  "test/unit/models/execution/execution-service.test.js"
  "test/unit/models/registry/model-registry.test.js"
  "test/unit/config/configuration-manager.test.js"
  "test/unit/integration/registry/integration-registry.test.js"
  "test/unit/mcp-server/mcp-server.test.js"
)

for test_file in "${CORE_TEST_FILES[@]}"; do
  if [ -f "$test_file" ]; then
    NODE_OPTIONS="--experimental-vm-modules" run_test "$test_file" "jest.unified.config.cjs" "unified config"
  else
    echo -e "${RED}File not found: $test_file${RESET}"
    echo -e "### $test_file\n\n❌ FILE NOT FOUND\n" >> "$RESULTS_FILE"
  fi
done

echo -e "${BLUE}Testing complete. Results saved to $RESULTS_FILE${RESET}"
