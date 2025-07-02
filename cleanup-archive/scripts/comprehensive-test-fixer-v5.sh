#!/bin/bash
# comprehensive-test-fixer-v5.sh
# Script to fix and run multiple test files

# Set colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
CYAN="\033[0;36m"
MAGENTA="\033[0;35m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Comprehensive Test Fixer v5${RESET}"
echo -e "${BLUE}====================================${RESET}"

# Create timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="test-fix-logs-${TIMESTAMP}"
mkdir -p "${LOG_DIR}"

# Function to fix a test file
fix_test_file() {
  local file=$1
  local backup="${file}.bak"
  
  echo -e "${YELLOW}Fixing: ${file}${RESET}"
  
  # Create backup if it doesn't exist
  if [ ! -f "$backup" ]; then
    cp "$file" "$backup"
    echo -e "${GREEN}Created backup: ${backup}${RESET}"
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
  
  # Remove Chai imports
  sed -i '/const chai = require/d' "$file"
  sed -i '/const expect = chai/d' "$file"
  sed -i '/import chai from/d' "$file"
  sed -i '/import { expect } from.*chai/d' "$file"
  sed -i '/\/\/ Chai assertions are provided by/d' "$file"
  
  echo -e "${GREEN}Fixed assertions in ${file}${RESET}"
}

# Function to run a test file with different configurations
run_test_file() {
  local file=$1
  local name=$(basename "$file" .js)
  local log_file="${LOG_DIR}/${name}.log"
  
  echo -e "${CYAN}Running: ${file}${RESET}"
  
  # Try with simple config first
  echo -e "${YELLOW}Testing with simple config...${RESET}"
  npx jest "$file" --config=jest.simple.config.cjs &> "$log_file"
  local result=$?
  
  if [ $result -eq 0 ]; then
    echo -e "${GREEN}✓ ${file} passed with simple config!${RESET}"
    echo "$file: PASSED with simple config" >> "${LOG_DIR}/passing_tests.txt"
    return 0
  else
    echo -e "${RED}✗ ${file} failed with simple config${RESET}"
    echo "$file: FAILED with simple config" >> "${LOG_DIR}/failing_tests.txt"
    
    # Try with master config
    echo -e "${YELLOW}Testing with master config...${RESET}"
    npx jest "$file" --config=jest.master.config.cjs &> "${log_file}.master"
    result=$?
    
    if [ $result -eq 0 ]; then
      echo -e "${GREEN}✓ ${file} passed with master config!${RESET}"
      echo "$file: PASSED with master config" >> "${LOG_DIR}/passing_tests.txt"
      return 0
    else
      echo -e "${RED}✗ ${file} failed with master config${RESET}"
      echo "$file: FAILED with master config" >> "${LOG_DIR}/failing_tests.txt"
      
      # Show error from log
      echo -e "${RED}Last 10 lines of error:${RESET}"
      tail -10 "${log_file}.master"
      return 1
    fi
  fi
}

# List of test files to fix and run
TEST_FILES=(
  "test/standalone-command-registry.test.js"
  "test/mcp-minimal.test.js"
  "test/diagnostic-simple.test.js"
  "test/ultra-minimal.test.js"
  "test/verify-env.test.js"
  "test/basic.test.js"
)

# Process each file
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_COUNT=${#TEST_FILES[@]}

for file in "${TEST_FILES[@]}"; do
  echo
  echo -e "${MAGENTA}Processing ${file}...${RESET}"
  
  fix_test_file "$file"
  
  if run_test_file "$file"; then
    PASS_COUNT=$((PASS_COUNT+1))
  else
    FAIL_COUNT=$((FAIL_COUNT+1))
  fi
  
  echo -e "${MAGENTA}---------------------------${RESET}"
done

# Generate summary
echo
echo -e "${BLUE}Test Summary:${RESET}"
echo -e "${GREEN}Passing: ${PASS_COUNT}/${TOTAL_COUNT}${RESET}"
echo -e "${RED}Failing: ${FAIL_COUNT}/${TOTAL_COUNT}${RESET}"
echo
echo -e "${BLUE}See logs in: ${LOG_DIR}${RESET}"
echo
