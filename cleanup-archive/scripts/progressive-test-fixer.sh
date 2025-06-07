#!/bin/bash
# Progressive Test Fixer - Start with minimal functionality and expand

# Set up colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}SwissKnife Progressive Test Fixer${NC}"
echo "================================="

# Create results directory
RESULTS_DIR="test-results-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"
LOG_FILE="$RESULTS_DIR/run_log.txt"

# Step 1: Verify minimal test execution
echo -e "${YELLOW}Step 1: Verifying minimal test execution${NC}" | tee -a $LOG_FILE

# Create minimal test file
MINIMAL_TEST_DIR="test-minimal"
mkdir -p "$MINIMAL_TEST_DIR"
MINIMAL_TEST_FILE="$MINIMAL_TEST_DIR/basic.test.js"

cat > "$MINIMAL_TEST_FILE" << 'EOF'
// Basic test to verify Jest execution
test('1 + 1 equals 2', () => {
  expect(1 + 1).toBe(2);
});
EOF

# Create minimal config file
MINIMAL_CONFIG="$MINIMAL_TEST_DIR/jest.config.cjs"

cat > "$MINIMAL_CONFIG" << 'EOF'
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  },
  transformIgnorePatterns: [],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"]
};
EOF

# Create minimal babel config
BABEL_CONFIG="$MINIMAL_TEST_DIR/babel.config.cjs"

cat > "$BABEL_CONFIG" << 'EOF'
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
};
EOF

# Run the minimal test
echo -e "Running minimal test..." | tee -a $LOG_FILE
MINIMAL_RESULT=$(cd "$MINIMAL_TEST_DIR" && npx jest --config=jest.config.cjs 2>&1)
MINIMAL_EXIT=$?

if [ $MINIMAL_EXIT -eq 0 ]; then
  echo -e "${GREEN}✅ Minimal test passed!${NC}" | tee -a $LOG_FILE
else
  echo -e "${RED}❌ Minimal test failed:${NC}" | tee -a $LOG_FILE
  echo "$MINIMAL_RESULT" | tee -a $LOG_FILE
  echo -e "${YELLOW}Cannot proceed until minimal test passes. Exiting.${NC}" | tee -a $LOG_FILE
  exit 1
fi

# Step 2: Test basic units
echo -e "\n${YELLOW}Step 2: Testing basic units${NC}" | tee -a $LOG_FILE

# Create a custom Jest config for testing specific units
UNIT_CONFIG="jest.unit.config.cjs"

cat > "$UNIT_CONFIG" << 'EOF'
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", {
      presets: [
        ['@babel/preset-env', {targets: {node: 'current'}}],
        '@babel/preset-typescript',
      ],
    }]
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol)/)"
  ],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
  testMatch: ["<rootDir>/test/unit/**/*.test.{js,jsx,ts,tsx}"]
};
EOF

# Run unit tests
echo -e "Running unit tests..." | tee -a $LOG_FILE
UNIT_RESULT=$(npx jest --config="$UNIT_CONFIG" 2>&1)
UNIT_EXIT=$?

if [ $UNIT_EXIT -eq 0 ]; then
  echo -e "${GREEN}✅ Unit tests passed!${NC}" | tee -a $LOG_FILE
else
  echo -e "${RED}❌ Some unit tests failed:${NC}" | tee -a $LOG_FILE
  echo "$UNIT_RESULT" | tee -a $LOG_FILE
fi

# Step 3: Generate detailed report
echo -e "\n${YELLOW}Step 3: Generating detailed report${NC}" | tee -a $LOG_FILE
REPORT_FILE="$RESULTS_DIR/test_report.md"

cat > "$REPORT_FILE" << EOF
# SwissKnife Test Report
Generated: $(date)

## Minimal Test Results
\`\`\`
$MINIMAL_RESULT
\`\`\`

## Unit Test Results
\`\`\`
$UNIT_RESULT
\`\`\`
EOF

echo -e "${GREEN}Report generated at $REPORT_FILE${NC}" | tee -a $LOG_FILE
