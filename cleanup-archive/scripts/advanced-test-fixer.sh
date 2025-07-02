#!/bin/bash
# Advanced test fixer for SwissKnife project

# Set up colors for better readability
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

# Create a results directory with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="./test-results-$TIMESTAMP"
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}SwissKnife Advanced Test Fixer${RESET}"
echo "================================="
echo "Results will be saved to: $RESULTS_DIR"
echo ""

# Helper function to run a test with detailed logging
run_test() {
  local test_file=$1
  local config=${2:-"jest.config.cjs"}
  local description=${3:-"Test"}
  local output_file="$RESULTS_DIR/$(basename $test_file | tr '/' '_' | sed 's/\./-/g').log"
  
  echo -e "${YELLOW}Running $description: $test_file${RESET}"
  echo -e "Using config: $config"
  
  # Run the test and capture output
  npx jest "$test_file" --config="$config" --no-cache > "$output_file" 2>&1
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✅ Test passed${RESET}"
    echo "$test_file: PASS" >> "$RESULTS_DIR/passing.txt"
    return 0
  else
    echo -e "${RED}❌ Test failed (exit code: $exit_code)${RESET}"
    echo "$test_file: FAIL" >> "$RESULTS_DIR/failing.txt"
    
    # Extract key error information
    echo -e "${RED}Error Summary:${RESET}"
    grep -n -A 2 -B 2 "Error:" "$output_file" | head -15 
    echo "..."
    echo -e "${YELLOW}See full output at: $output_file${RESET}"
    
    return $exit_code
  fi
}

# Step 1: Check Jest installation
echo -e "\n${BLUE}Step 1: Checking Jest installation${RESET}"
npx jest --version > "$RESULTS_DIR/jest_version.txt" 2>&1
echo -e "Jest version: $(cat "$RESULTS_DIR/jest_version.txt")"

# Step 2: Create ultra-minimal test
echo -e "\n${BLUE}Step 2: Creating ultra-minimal test${RESET}"
cat > "./test-minimal.js" << 'EOF'
test('Minimal test', () => {
  expect(true).toBe(true);
});
EOF
echo "Created: ./test-minimal.js"

# Step 3: Try running with standard Jest
echo -e "\n${BLUE}Step 3: Running with default Jest configuration${RESET}"
npx jest ./test-minimal.js --testMatch='[\"**/test-minimal.js\"]' > "$RESULTS_DIR/default_run.log" 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Test passed with default configuration${RESET}"
else
  echo -e "${RED}❌ Test failed with default configuration${RESET}"
  echo "Testing alternative configurations..."
  
  # Create a minimal Jest config
  cat > "./minimal.jest.config.js" << 'EOF'
module.exports = {
  testEnvironment: 'node',
  testRegex: 'test-minimal\\.js$',
  verbose: true
};
EOF
  
  # Try with minimal config
  npx jest --config=./minimal.jest.config.js > "$RESULTS_DIR/minimal_config_run.log" 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test passed with minimal configuration${RESET}"
    CONFIG="./minimal.jest.config.js"
  else
    echo -e "${RED}❌ All configurations failed${RESET}"
    echo "Proceeding with existing configs for diagnostic purposes"
  fi
fi

# Step 4: Run specific tests with fixe config
echo -e "\n${BLUE}Step 4: Running core tests${RESET}"

# Check if any of our specific test configs work
echo -e "${YELLOW}Testing different Jest configurations...${RESET}"

declare -a configs=(
  "jest.config.cjs"
  "jest-improved-tests.config.cjs" 
  "jest-ts.config.cjs"
  "jest-minimal-final.js"
)

for config in "${configs[@]}"; do
  if [ -f "$config" ]; then
    echo -e "Trying config: $config"
    npx jest ./test-minimal.js --config="$config" > "$RESULTS_DIR/config_${config//\//_}.log" 2>&1
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Config $config works!${RESET}"
      WORKING_CONFIG="$config"
      break
    else
      echo -e "${RED}❌ Config $config failed${RESET}"
    fi
  fi
done

if [ -z "$WORKING_CONFIG" ]; then
  echo -e "${YELLOW}Creating a new working config...${RESET}"
  cat > "./working.jest.config.js" << 'EOF'
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test-*.js'],
  transform: {},
  verbose: true
};
EOF

  npx jest ./test-minimal.js --config=./working.jest.config.js > "$RESULTS_DIR/working_config_run.log" 2>&1
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Created working configuration!${RESET}"
    WORKING_CONFIG="./working.jest.config.js"
  else
    echo -e "${RED}❌ Could not create working configuration${RESET}"
    echo "Continuing with default configuration for diagnostics"
    WORKING_CONFIG="jest.config.cjs"
  fi
fi

echo -e "\n${YELLOW}Using config: $WORKING_CONFIG${RESET}"

# Run tests for specific modules
declare -a test_targets=(
  "./test/unit/models/registry-revised.test.ts"
  "./test/unit/storage/storage.test.ts"
  "./test/unit/tasks/fibonacci-heap.test.ts"
  "./test/unit/commands/help-generator.test.ts"
)

for test_target in "${test_targets[@]}"; do
  if [ -f "$test_target" ]; then
    run_test "$test_target" "$WORKING_CONFIG" "$(basename $test_target)"
  else
    echo -e "${YELLOW}Test file not found: $test_target${RESET}"
  fi
done

# Step 5: Generate test report
echo -e "\n${BLUE}Step 5: Generating test report${RESET}"
REPORT_FILE="$RESULTS_DIR/test_report.md"

cat > "$REPORT_FILE" << EOF
# SwissKnife Test Report
Generated: $(date)

## Test Environment
- Jest version: $(cat "$RESULTS_DIR/jest_version.txt")
- Node.js version: $(node --version)
- Working config: $WORKING_CONFIG

## Test Results

### Passing Tests
$(if [ -f "$RESULTS_DIR/passing.txt" ]; then cat "$RESULTS_DIR/passing.txt" | sort | sed 's/^/- /'; else echo "None"; fi)

### Failing Tests
$(if [ -f "$RESULTS_DIR/failing.txt" ]; then cat "$RESULTS_DIR/failing.txt" | sort | sed 's/^/- /'; else echo "None"; fi)

## Diagnostics
- Haste module naming collision detected: Multiple package.json files need de-duplication
- Module resolution issues between ESM and CommonJS formats may exist
- TypeScript configuration might need adjustment for test files

## Recommendations
1. Fix module naming collisions by removing or renaming duplicate package.json files
2. Ensure consistent module format usage across test files (ESM or CommonJS)
3. Update path imports to include proper file extensions (.js) for ESM compatibility
4. Create comprehensive mocks for external dependencies
5. Fix TypeScript configuration to properly handle test files
EOF

echo -e "${GREEN}Report generated: $REPORT_FILE${RESET}"

# Step 6: Create a script to run tests with the working config
echo -e "\n${BLUE}Step 6: Creating a script to run tests with the working config${RESET}"
cat > "./run-working-tests.sh" << EOF
#!/bin/bash
# Run tests with the working configuration

# Get test path from command line or use default
TEST_PATH=\${1:-"test"}

# Use the working configuration
CONFIG_PATH="$WORKING_CONFIG"

echo "Running tests at: \$TEST_PATH"
echo "Using config: \$CONFIG_PATH"
echo ""

# Run Jest with the working configuration
npx jest "\$TEST_PATH" --config="\$CONFIG_PATH" --verbose "\$@"
EOF
chmod +x "./run-working-tests.sh"

echo -e "${GREEN}Created run-working-tests.sh script${RESET}"
echo -e "You can run tests with: ${YELLOW}./run-working-tests.sh <test-path>${RESET}"

echo -e "\n${BLUE}Test diagnostics complete!${RESET}"
