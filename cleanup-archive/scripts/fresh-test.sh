#!/bin/bash
# Fresh test execution script that addresses environmental issues

# Set up colors
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Fresh Test Runner${RESET}"
echo "============================"

# Create unique temporary test directory
TEMP_DIR="./temp-test-$(date +%s)"
mkdir -p "$TEMP_DIR"
echo "Created temporary directory: $TEMP_DIR"

# Create clean minimal test file
cat > "$TEMP_DIR/basic.test.js" << 'EOF'
test('basic test', () => {
  expect(1 + 1).toBe(2);
});
EOF

# Create clean minimal Jest configuration
cat > "$TEMP_DIR/jest.config.js" << 'EOF'
module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testRegex: ['basic\\.test\\.js$']
};
EOF

echo -e "\n${YELLOW}Running basic test${RESET}"
cd "$TEMP_DIR" && npx jest --no-cache

if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ Basic test passed!${RESET}"
  echo -e "\nWe've confirmed Jest works correctly in a clean environment."
  echo -e "This suggests there are environmental issues in the main project directory."
  
  # Create a test runner script that uses the clean directory
  cat > "../run-clean-test.sh" << EOF
#!/bin/bash
# Run tests in a clean environment

# Create a clean temporary test directory
TEMP_DIR="$TEMP_DIR"

# Copy the specified test file to the clean environment
TEST_FILE=\${1:-"test/unit/models/registry.test.ts"}
DEST_FILE="\$TEMP_DIR/\$(basename \$TEST_FILE)"

# Also copy any directly imported files
# This is a simplistic approach; a real solution would need to parse imports
PARENT_DIR=\$(dirname \$TEST_FILE)
mkdir -p "\$TEMP_DIR/dependencies"
cp \$TEST_FILE "\$DEST_FILE"
cp -r \$PARENT_DIR/* "\$TEMP_DIR/dependencies/" 2>/dev/null || true

echo "Running test: \$TEST_FILE in clean environment"

# Run Jest in the clean directory
cd "\$TEMP_DIR" && npx jest "\$DEST_FILE" --no-cache
EXIT_CODE=\$?

if [ \$EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Test passed!${RESET}"
else
  echo -e "${RED}❌ Test failed.${RESET}"
fi

exit \$EXIT_CODE
EOF
  chmod +x "../run-clean-test.sh"
  
  echo -e "\n${YELLOW}Created run-clean-test.sh script.${RESET}"
  echo -e "You can run tests with: ${BLUE}./run-clean-test.sh <path/to/test/file>${RESET}"
else
  echo -e "\n${RED}❌ Basic test failed even in a clean environment.${RESET}"
  echo -e "This suggests a more fundamental issue with the Jest installation."
  echo -e "\nRecommendations:"
  echo -e "1. Check Node.js version: $(node -v)"
  echo -e "2. Try reinstalling Jest: npm install --save-dev jest"
  echo -e "3. Check for global configuration conflicts"
fi

echo -e "\n${BLUE}Clean Test Environment Script Complete${RESET}"
