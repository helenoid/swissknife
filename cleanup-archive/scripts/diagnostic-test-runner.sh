#!/bin/bash
# Diagnostic test runner for SwissKnife tests
# This script runs a minimal diagnostic test to identify and fix Jest configuration issues

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}SwissKnife Test Diagnostics${NC}"
echo "============================="
echo ""

# Create diagnostics directory
DIAG_DIR="./test-diagnostics"
mkdir -p "$DIAG_DIR"

# Create a minimal test file
cat > "$DIAG_DIR/minimal.test.js" << EOF
// Super minimal test
test('Just checking if 1 + 1 = 2', () => {
  expect(1 + 1).toBe(2);
});
EOF

echo -e "${YELLOW}Created minimal test file at $DIAG_DIR/minimal.test.js${NC}"

# Create a minimal Jest configuration
cat > "$DIAG_DIR/minimal.config.js" << EOF
module.exports = {
  testEnvironment: 'node',
  verbose: true
};
EOF

echo -e "${YELLOW}Created minimal Jest config at $DIAG_DIR/minimal.config.js${NC}"

# Try running with npx directly
echo -e "\n${BLUE}Running minimal test with npx jest...${NC}"
npx jest "$DIAG_DIR/minimal.test.js" --config="$DIAG_DIR/minimal.config.js" > "$DIAG_DIR/basic.log" 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Basic Jest setup is working${NC}"
else
  echo -e "${RED}❌ Basic Jest setup failed${NC}"
  echo "Error log:"
  cat "$DIAG_DIR/basic.log"
fi

# Check if Jest is installed correctly
if ! npm list jest > /dev/null 2>&1; then
  echo -e "\n${YELLOW}Jest may not be installed correctly. Installing it...${NC}"
  npm install -D jest
fi

# Let's test with a local install of jest without babel or other complications
echo -e "\n${BLUE}Running minimal test directly with node_modules/.bin/jest...${NC}"
./node_modules/.bin/jest "$DIAG_DIR/minimal.test.js" --config="$DIAG_DIR/minimal.config.js" > "$DIAG_DIR/direct.log" 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Direct Jest call is working${NC}"
else
  echo -e "${RED}❌ Direct Jest call failed${NC}"
  echo "Error log:"
  cat "$DIAG_DIR/direct.log"
fi

# Check Node.js version
echo -e "\n${BLUE}Node.js version:${NC}"
node -v

# Check Jest version
echo -e "\n${BLUE}Jest version:${NC}"
npx jest --version

# Generate diagnostics report
echo -e "\n${BLUE}Generating diagnostic report...${NC}"
echo "# SwissKnife Jest Diagnostic Report" > "$DIAG_DIR/report.md"
echo "Generated: $(date)" >> "$DIAG_DIR/report.md"
echo "" >> "$DIAG_DIR/report.md"
echo "## Node.js Version" >> "$DIAG_DIR/report.md"
echo "\`\`\`" >> "$DIAG_DIR/report.md"
node -v >> "$DIAG_DIR/report.md"
echo "\`\`\`" >> "$DIAG_DIR/report.md"
echo "" >> "$DIAG_DIR/report.md"
echo "## Jest Version" >> "$DIAG_DIR/report.md"
echo "\`\`\`" >> "$DIAG_DIR/report.md"
npx jest --version >> "$DIAG_DIR/report.md"
echo "\`\`\`" >> "$DIAG_DIR/report.md"
echo "" >> "$DIAG_DIR/report.md"
echo "## npm Packages" >> "$DIAG_DIR/report.md"
echo "\`\`\`" >> "$DIAG_DIR/report.md"
npm list | grep -E '(jest|babel|typescript)' >> "$DIAG_DIR/report.md"
echo "\`\`\`" >> "$DIAG_DIR/report.md"

echo -e "${GREEN}Diagnostics complete. Report generated at $DIAG_DIR/report.md${NC}"
