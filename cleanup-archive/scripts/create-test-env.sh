#!/bin/bash
# This script creates a reliable working test environment for SwissKnife

# Set up colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}SwissKnife Test Environment Builder${NC}"
echo "================================="

# Create working directory
TEST_WORKING_DIR="./test-env"
mkdir -p "$TEST_WORKING_DIR"

# Step 1: Create a minimal configuration that works
echo -e "\n${YELLOW}Step 1: Creating minimal Jest configuration${NC}"
cat > "$TEST_WORKING_DIR/jest.config.js" << 'EOF'
module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest"
  },
  moduleNameMapper: {
    "^(.*)\\.js$": "$1"
  }
};
EOF
echo "Created: $TEST_WORKING_DIR/jest.config.js"

# Step 2: Create a minimal test
echo -e "\n${YELLOW}Step 2: Creating minimal test${NC}"
cat > "$TEST_WORKING_DIR/minimal.test.js" << 'EOF'
test('1 + 1 = 2', () => {
  expect(1 + 1).toBe(2);
});
EOF
echo "Created: $TEST_WORKING_DIR/minimal.test.js"

# Step 3: Ensure Babel is configured correctly
echo -e "\n${YELLOW}Step 3: Creating Babel configuration${NC}"
cat > "$TEST_WORKING_DIR/babel.config.js" << 'EOF'
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
  plugins: [
    ['@babel/plugin-transform-modules-commonjs']
  ]
};
EOF
echo "Created: $TEST_WORKING_DIR/babel.config.js"

# Step 4: Run the minimal test
echo -e "\n${YELLOW}Step 4: Running minimal test${NC}"
cd "$TEST_WORKING_DIR" && npx jest minimal.test.js

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Minimal test passed!${NC}"
  echo -e "\n${YELLOW}The test environment is working. You can use this configuration as a base for all tests.${NC}"
  
  # Create a test runner script
  cat > "../run-working-tests.sh" << 'EOF'
#!/bin/bash
# Run tests with the known-working configuration

# Get test path from first argument or use default
TEST_PATH=${1:-"test"}

# Use the working configuration
CONFIG_PATH="./test-env/jest.config.js"

# Run Jest with the working configuration
npx jest "$TEST_PATH" --config="$CONFIG_PATH" --verbose "$@"
EOF
  chmod +x "../run-working-tests.sh"
  
  echo -e "\n${GREEN}Created run-working-tests.sh script.${NC}"
  echo -e "Run specific tests with: ${YELLOW}./run-working-tests.sh <test-path>${NC}"
  
else
  echo -e "${RED}✗ Minimal test failed.${NC}"
  echo "There may be a more fundamental issue with the Jest setup."
fi

# Step 5: Create a diagnostic summary
echo -e "\n${BLUE}Testing Environment Summary${NC}"
echo -e "${BLUE}=========================${NC}"
echo -e "Node version: $(node -v)"
echo -e "NPM version: $(npm -v)"
echo -e "Jest version: $(npx jest --version)"

# List related versions
echo -e "\nRelevant package versions:"
npm list jest babel-jest @babel/core typescript | grep -E "jest|babel|typescript" || echo "Package information not available"
