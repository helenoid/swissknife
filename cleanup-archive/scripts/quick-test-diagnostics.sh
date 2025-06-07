#!/bin/bash
# Short diagnostic script to fix remaining test issues

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Quick Test Diagnostics${RESET}"
echo "================================="

# Create a very simple test file
cat > quick-test.js << 'EOF'
test('simple addition test', () => {
  expect(1 + 1).toBe(2);
});
EOF

echo -e "${YELLOW}Running a basic test to verify Jest works${RESET}"
npx jest quick-test.js

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Basic Jest test works${RESET}"
else
  echo -e "${RED}✗ Basic Jest test failed. Trying to fix...${RESET}"
  
  # Try installing the specific package that seems to be causing issues
  echo "Installing @jest/globals..."
  npm install --save-dev @jest/globals
fi

# Now check the storage test specifically
echo -e "\n${YELLOW}Running storage test${RESET}"
npx jest test/unit/storage/storage.test.ts

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Storage test passed${RESET}"
else
  echo -e "${RED}✗ Storage test failed. Getting diagnostic information...${RESET}"
  
  echo "Checking imports..."
  grep -n "import " test/unit/storage/storage.test.ts | head -10
  
  echo "Checking storage interfaces..."
  grep -n "interface" src/storage/provider.ts || echo "No provider interface found"
fi

# Check registry test
echo -e "\n${YELLOW}Running registry test${RESET}"
npx jest test/unit/models/registry-revised.test.ts

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Registry test passed${RESET}"
else
  echo -e "${RED}✗ Registry test failed. Getting diagnostic information...${RESET}"
  
  echo "Checking imports..."
  grep -n "import " test/unit/models/registry-revised.test.ts | head -10
fi

# Final diagnostic
echo -e "\n${YELLOW}Saving final diagnostics${RESET}"

echo "Jest version:"
npx jest --version

echo "Node version:"
node --version

# Create a diagnostic helper file
cat > fix-chai.js << 'EOF'
// Helper to fix chai issues
try {
  const chai = require('chai');
  console.log('Chai loaded successfully!');
  console.log('chai.expect:', typeof chai.expect);
  console.log('chai.assert:', typeof chai.assert);
} catch (e) {
  console.error('Failed to load chai:', e.message);
  console.log('Trying to install chai...');
  require('child_process').execSync('npm install --save-dev chai @types/chai', {stdio: 'inherit'});
  console.log('Chai installation attempted. Please run the tests again.');
}
EOF

echo -e "${YELLOW}Running chai diagnostic helper${RESET}"
node fix-chai.js
