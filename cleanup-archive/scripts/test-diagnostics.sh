#!/bin/bash
# test-diagnostics.sh - Diagnose and fix Jest testing environment issues

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Test Environment Diagnostics${RESET}"
echo "====================================="

# Create diagnostic directory
DIAG_DIR="./test-diagnostics-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$DIAG_DIR"
echo -e "Diagnostic files will be saved in: ${YELLOW}$DIAG_DIR${RESET}\n"

# Function to log diagnostic information
log_diagnostic() {
  local title="$1"
  local cmd="$2"
  
  echo -e "\n${YELLOW}$title${RESET}"
  echo -e "Command: $cmd\n"
  
  local output_file="$DIAG_DIR/$(echo "$title" | tr ' ' '_' | tr '[:upper:]' '[:lower:]').log"
  
  # Execute command and capture output
  eval "$cmd" > "$output_file" 2>&1
  local exit_code=$?
  
  if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✓ Success${RESET}"
  else
    echo -e "${RED}✗ Failed (Exit code: $exit_code)${RESET}"
  fi
  
  # Show first few lines of output
  head -n 10 "$output_file" | sed 's/^/  /'
  
  if [ $(wc -l < "$output_file") -gt 10 ]; then
    echo "  ..."
  fi
  
  echo -e "Full output: $output_file"
}

# 1. Check Node.js environment
log_diagnostic "Node Version Info" "node --version && npm --version"

# 2. Check Jest installation
log_diagnostic "Jest Version" "npx jest --version"

# 3. Check package.json
log_diagnostic "Package.json Test Config" "node -e \"console.log(JSON.stringify(require('./package.json').scripts, null, 2))\""

# 4. Create a minimal working test file
echo -e "\n${YELLOW}Creating minimal test file${RESET}"
cat > "$DIAG_DIR/minimal.test.js" << 'EOF'
test('1 + 1 = 2', () => {
  expect(1 + 1).toBe(2);
});
EOF
echo "Created: $DIAG_DIR/minimal.test.js"

# 5. Try running with default config
log_diagnostic "Run Minimal Test (Default Config)" "npx jest $DIAG_DIR/minimal.test.js"

# 6. Create a simple test config
echo -e "\n${YELLOW}Creating minimal Jest config${RESET}"
cat > "$DIAG_DIR/simple.config.js" << 'EOF'
module.exports = {
  testEnvironment: 'node',
  verbose: true
};
EOF
echo "Created: $DIAG_DIR/simple.config.js"

# 7. Try running with simple config
log_diagnostic "Run Minimal Test (Simple Config)" "npx jest $DIAG_DIR/minimal.test.js --config=$DIAG_DIR/simple.config.js"

# 8. Create a more complete config
echo -e "\n${YELLOW}Creating detailed Jest config${RESET}"
cat > "$DIAG_DIR/detailed.config.js" << 'EOF'
module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.(js|jsx|mjs)$": "babel-jest"
  },
  moduleNameMapper: {
    "^(.*)\\.js$": "$1"
  },
  testTimeout: 30000,
  verbose: true
};
EOF
echo "Created: $DIAG_DIR/detailed.config.js"

# 9. Ensure babel config exists
echo -e "\n${YELLOW}Creating basic Babel config${RESET}"
cat > "$DIAG_DIR/babel.config.js" << 'EOF'
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ]
};
EOF
echo "Created: $DIAG_DIR/babel.config.js"

# 10. Try running with detailed config
log_diagnostic "Run Minimal Test (Detailed Config)" "cp $DIAG_DIR/babel.config.js ./babel.config.js.bak && cp $DIAG_DIR/babel.config.js ./ && npx jest $DIAG_DIR/minimal.test.js --config=$DIAG_DIR/detailed.config.js && mv ./babel.config.js.bak ./babel.config.js"

# 11. Generate report
echo -e "\n${YELLOW}Generating report${RESET}"
REPORT_FILE="$DIAG_DIR/report.md"

cat > "$REPORT_FILE" << EOF
# SwissKnife Test Environment Diagnostic Report
Generated: $(date)

## System Information
- Node.js: $(node --version)
- NPM: $(npm --version)
- OS: $(uname -a)

## Installed Jest-Related Packages
\`\`\`
$(npm list | grep -E '(jest|babel|typescript)')
\`\`\`

## Test Results

| Test | Status | Output Location |
| ---- | ------ | --------------- |
EOF

for log_file in "$DIAG_DIR"/*.log; do
  test_name=$(basename "$log_file" .log | tr '_' ' ' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2));}1')
  if grep -q "Error\|error\|FAIL" "$log_file"; then
    status="❌ Failed"
  else
    status="✅ Passed"
  fi
  echo "| $test_name | $status | $(basename "$log_file") |" >> "$REPORT_FILE"
done

echo -e "\nReport generated: ${YELLOW}$REPORT_FILE${RESET}"

# 12. Create a working test runner
echo -e "\n${YELLOW}Creating working test runner${RESET}"
cat > "run-working-tests.sh" << 'EOF'
#!/bin/bash
# Run tests with a working configuration

TEST_PATH=${1:-"test"}

# Use the working detailed configuration
CONFIG_PATH="./test-diagnostics-"$(ls -1t | grep test-diagnostics | head -n1)"/detailed.config.js"

echo "Running tests with working configuration: $CONFIG_PATH"
echo "Test path: $TEST_PATH"
echo ""

# Run Jest with the working configuration
npx jest "$TEST_PATH" --config="$CONFIG_PATH" --verbose
EOF
chmod +x "run-working-tests.sh"

echo -e "\n${GREEN}Created run-working-tests.sh${RESET}"
echo -e "You can run tests with: ${YELLOW}./run-working-tests.sh <test-path>${RESET}"

echo -e "\n${BLUE}Diagnostics complete!${RESET}"
