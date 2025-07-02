#!/bin/bash
# Quick diagnostic test runner for fixing remaining issues
# This will help us identify and fix failing tests systematically

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

RESULTS_FILE="quick-test-results.md"
echo "# Quick Test Diagnostic Results" > "$RESULTS_FILE"
echo "Run on: $(date)" >> "$RESULTS_FILE"
echo "" >> "$RESULTS_FILE"

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
  echo -e "${YELLOW}Testing: $test_file${RESET}"
  echo -e "### $test_file" >> "$RESULTS_FILE"
  echo "\`\`\`" >> "$RESULTS_FILE"
  
  npx jest "$test_file" --config=jest-super-minimal.config.cjs > >(tee -a "$RESULTS_FILE") 2>&1
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED: $test_file${RESET}"
    echo -e "\n✅ PASSED\n" >> "$RESULTS_FILE"
  else
    echo -e "${RED}❌ FAILED: $test_file${RESET}"
    echo -e "\n❌ FAILED\n" >> "$RESULTS_FILE"
  fi
  echo "\`\`\`" >> "$RESULTS_FILE"
  echo "" >> "$RESULTS_FILE"
done

# Try running with the unified config
echo -e "\n${BLUE}Running key tests with unified config...${RESET}"
echo -e "## Tests with unified config" >> "$RESULTS_FILE"

for test_file in "${TEST_FILES[@]}"; do
  echo -e "${YELLOW}Testing with unified config: $test_file${RESET}"
  echo -e "### $test_file (unified config)" >> "$RESULTS_FILE"
  echo "\`\`\`" >> "$RESULTS_FILE"
  
  NODE_OPTIONS="--experimental-vm-modules" npx jest "$test_file" --config=jest.unified.config.cjs > >(tee -a "$RESULTS_FILE") 2>&1
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED: $test_file${RESET}"
    echo -e "\n✅ PASSED\n" >> "$RESULTS_FILE"
  else
    echo -e "${RED}❌ FAILED: $test_file${RESET}"
    echo -e "\n❌ FAILED\n" >> "$RESULTS_FILE"
  fi
  echo "\`\`\`" >> "$RESULTS_FILE"
  echo "" >> "$RESULTS_FILE"
done

echo -e "${BLUE}Testing complete. Results saved to $RESULTS_FILE${RESET}"
