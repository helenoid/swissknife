#!/bin/bash
# run_mcp_tests.sh - A comprehensive test script for MCP server functionality
# This script runs all MCP-related tests and generates detailed reports.

# Set strict error handling
set -e
set -o pipefail

# Define colors
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
RESET="\033[0m"

echo -e "${GREEN}=====================================${RESET}"
echo -e "${GREEN}🔍 MCP Server Comprehensive Test Suite${RESET}"
echo -e "${GREEN}=====================================${RESET}"
echo ""

# Create results directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="./mcp-test-results-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"
echo "📁 Test results will be saved to: $RESULTS_DIR"

# Environment validation
echo -e "${YELLOW}Validating test environment...${RESET}"

# Check Node.js version
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ v[0-9]+\.[0-9]+ ]]; then
  echo -e "${RED}❌ Node.js not found or invalid version${RESET}"
  exit 1
fi

# Check if required packages are installed
npm list @modelcontextprotocol/sdk > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Required package @modelcontextprotocol/sdk not found${RESET}"
  echo "Installing required dependencies..."
  npm install
fi

# Ensure the project is built
echo -e "${YELLOW}Building project...${RESET}"
npm run build

# Function to run a test and report results
run_test() {
  local test_path=$1
  local test_name=$(basename "$test_path" .test.ts)
  local result_file="$RESULTS_DIR/${test_name}.result"
  local start_time=$(date +%s)
  
  echo -e "${YELLOW}Running test: $test_path${RESET}"
  
  # Create a temporary directory for the test if needed
  local test_temp_dir="$RESULTS_DIR/tmp-$test_name"
  mkdir -p "$test_temp_dir"
  
  # Run the test with jest
  NODE_OPTIONS="--max-old-space-size=4096" npx jest "$test_path" --verbose --runInBand > "$result_file" 2>&1
  local exit_code=$?
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ PASSED: $test_path (${duration}s)${RESET}"
    echo "$test_path: PASS (${duration}s)" >> "$RESULTS_DIR/passing.txt"
  else
    echo -e "${RED}❌ FAILED: $test_path (${duration}s)${RESET}"
    echo "$test_path: FAIL (${duration}s)" >> "$RESULTS_DIR/failing.txt"
    
    # Extract error messages for easier debugging
    echo -e "\nError summary:" >> "$result_file"
    grep -A 3 -B 3 "Error:" "$result_file" >> "$result_file.errors" 2>/dev/null || true
    grep -A 3 -B 3 "FAIL " "$result_file" >> "$result_file.errors" 2>/dev/null || true
  fi
  
  # Clean up temporary directory
  rm -rf "$test_temp_dir"
  
  return $exit_code
}

# Run diagnostic tests first to check environment
echo -e "${GREEN}Running MCP environment tests...${RESET}"
run_test "test/unit/mcp-server/mcp-server.test.ts"

# Run unit tests
echo -e "${GREEN}Running MCP unit tests...${RESET}"
for test_file in test/unit/services/mcp/*.test.ts; do
  run_test "$test_file"
done
run_test "test/unit/patches/mcp/mcp-server-controller.test.ts"

# Run integration tests
echo -e "${GREEN}Running MCP integration tests...${RESET}"
for test_file in test/integration/mcp/*.test.ts; do
  run_test "$test_file"
done

# Run E2E tests
echo -e "${GREEN}Running MCP E2E tests...${RESET}"
for test_file in test/e2e/cli/mcp/*.test.ts test/e2e/cli-workflows/mcp/*.test.ts; do
  run_test "$test_file" || true # Don't fail the whole script if E2E tests fail
done

# Generate test summary
echo -e "${YELLOW}Generating test summary...${RESET}"
echo "# MCP Server Test Results Summary" > "$RESULTS_DIR/summary.md"
echo "Generated: $(date)" >> "$RESULTS_DIR/summary.md"
echo "" >> "$RESULTS_DIR/summary.md"

echo "## Environment" >> "$RESULTS_DIR/summary.md"
echo "- Node.js: $NODE_VERSION" >> "$RESULTS_DIR/summary.md"
echo "- OS: $(uname -a)" >> "$RESULTS_DIR/summary.md"
echo "" >> "$RESULTS_DIR/summary.md"

echo "## Passing Tests" >> "$RESULTS_DIR/summary.md"
if [ -f "$RESULTS_DIR/passing.txt" ]; then
  cat "$RESULTS_DIR/passing.txt" | sed 's/^/- /' >> "$RESULTS_DIR/summary.md"
else
  echo "No passing tests found." >> "$RESULTS_DIR/summary.md"
fi

echo "" >> "$RESULTS_DIR/summary.md"
echo "## Failing Tests" >> "$RESULTS_DIR/summary.md"
if [ -f "$RESULTS_DIR/failing.txt" ]; then
  cat "$RESULTS_DIR/failing.txt" | sed 's/^/- /' >> "$RESULTS_DIR/summary.md"
  
  echo "" >> "$RESULTS_DIR/summary.md"
  echo "## Failure Analysis" >> "$RESULTS_DIR/summary.md"
  
  # Analyze common failure patterns
  echo "### Common Error Patterns" >> "$RESULTS_DIR/summary.md"
  echo "Analyzing most frequent errors:" >> "$RESULTS_DIR/summary.md"
  
  # Count and sort errors by frequency
  grep -h "Error:" "$RESULTS_DIR"/*.errors 2>/dev/null | sort | uniq -c | sort -nr | head -10 | \
    while read count error; do
      echo "- **${count}x**: \`${error}\`" >> "$RESULTS_DIR/summary.md"
    done
else
  echo "No failing tests found." >> "$RESULTS_DIR/summary.md"
fi

echo "" >> "$RESULTS_DIR/summary.md"
echo "## Recommendations" >> "$RESULTS_DIR/summary.md"
echo "Based on test results, here are some recommendations:" >> "$RESULTS_DIR/summary.md"
echo "" >> "$RESULTS_DIR/summary.md"

# Generate recommendations based on error patterns
if [ -f "$RESULTS_DIR/failing.txt" ]; then
  if grep -q "Cannot find module" "$RESULTS_DIR"/*.errors 2>/dev/null; then
    echo "- **Module Resolution**: Check import paths and ensure correct extensions (.js) in imports" >> "$RESULTS_DIR/summary.md"
  fi
  
  if grep -q "timeout" "$RESULTS_DIR"/*.errors 2>/dev/null; then
    echo "- **Timeouts**: Increase timeout thresholds or optimize test performance" >> "$RESULTS_DIR/summary.md"
  fi
  
  if grep -q "ECONNREFUSED" "$RESULTS_DIR"/*.errors 2>/dev/null || grep -q "Connection refused" "$RESULTS_DIR"/*.errors 2>/dev/null; then
    echo "- **Connection Issues**: Verify server initialization and port availability" >> "$RESULTS_DIR/summary.md"
  fi
  
  if grep -q "TypeError:" "$RESULTS_DIR"/*.errors 2>/dev/null; then
    echo "- **Type Errors**: Check for null/undefined values or incorrect API usage" >> "$RESULTS_DIR/summary.md"
  fi
else
  echo "- All tests passed successfully!" >> "$RESULTS_DIR/summary.md"
fi

echo -e "${GREEN}Test suite complete. Results saved to $RESULTS_DIR/summary.md${RESET}"

# Make the script executable
chmod +x "$0"
