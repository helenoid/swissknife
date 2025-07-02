#!/bin/bash
# Script to fix the Jest environment and make tests pass

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}SwissKnife Jest Environment Fixer${NC}"
echo "================================="

echo -e "\n${YELLOW}Step 1: Installing required dependencies${NC}"
npm install --save-dev \
  jest@29.7.0 \
  @jest/globals \
  @types/jest \
  jest-environment-node \
  babel-jest@29.7.0 \
  @babel/core \
  @babel/preset-env \
  @babel/preset-typescript \
  @babel/plugin-transform-modules-commonjs \
  @babel/plugin-proposal-class-properties \
  @babel/plugin-proposal-object-rest-spread \
  ts-jest@29.1.1 \
  chai \
  @types/chai

echo -e "\n${YELLOW}Step 2: Creating a robust Jest configuration${NC}"
cat > jest-fixed-all.config.cjs << 'EOF'
/**
 * Robust Jest configuration for SwissKnife project
 */
module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test matching pattern
  testMatch: ['<rootDir>/test/**/*.test.{js,jsx,ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Transform with babel
  transform: {
    "^.+\\.(js|jsx|mjs)$": ["babel-jest", {
      presets: [["@babel/preset-env", { targets: { node: "current" } }]],
      plugins: ["@babel/plugin-transform-modules-commonjs"]
    }],
    "^.+\\.(ts|tsx)$": ["babel-jest", {
      presets: [
        ["@babel/preset-env", { targets: { node: "current" } }],
        "@babel/preset-typescript"
      ],
      plugins: ["@babel/plugin-transform-modules-commonjs"]
    }]
  },
  
  // Module resolution
  moduleNameMapper: {
    "^(.*)\\.js$": "$1"
  },
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
  
  // Increased timeout
  testTimeout: 30000,
  
  // Setup file
  setupFilesAfterEnv: ["<rootDir>/test/setup-jest-all.js"],
  
  // Enable verbose output
  verbose: true
};
EOF
echo "Created jest-fixed-all.config.cjs"

echo -e "\n${YELLOW}Step 3: Creating a robust setup file${NC}"
mkdir -p test
cat > test/setup-jest-all.js << 'EOF'
// Basic Jest setup
jest.setTimeout(30000);

// Install global expect and jest objects correctly
if (!global.expect) {
  try {
    const jestGlobals = require('@jest/globals');
    global.expect = jestGlobals.expect;
    global.jest = jestGlobals.jest;
    global.describe = jestGlobals.describe;
    global.test = jestGlobals.test;
    global.beforeEach = jestGlobals.beforeEach;
    global.afterEach = jestGlobals.afterEach;
    global.beforeAll = jestGlobals.beforeAll;
    global.afterAll = jestGlobals.afterAll;
  } catch (e) {
    console.error('Failed to load @jest/globals:', e.message);
  }
}

// Add chai for compatibility with existing tests
try {
  const chai = require('chai');
  global.chai = chai;
  // Don't override Jest expect
  global.chaiExpect = chai.expect;
  global.assert = chai.assert;
  global.should = chai.should();
} catch (e) {
  console.warn('Failed to load chai, continuing with Jest expect:', e.message);
}

// Log setup completion
console.log('Jest test environment setup complete');
EOF
echo "Created test/setup-jest-all.js"

echo -e "\n${YELLOW}Step 4: Creating a minimal test to verify the environment${NC}"
cat > test/verify-env.test.js << 'EOF'
// Simple verification test
test('Jest environment is working', () => {
  expect(1 + 1).toBe(2);
  console.log('Basic test assertion passed!');
});
EOF
echo "Created test/verify-env.test.js"

echo -e "\n${YELLOW}Step 5: Running verification test${NC}"
npx jest test/verify-env.test.js --config=jest-fixed-all.config.cjs

if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ Jest environment fixed successfully!${NC}"
  
  # Create a script to run all tests with the fixed configuration
  cat > run-all-tests.sh << 'EOF'
#!/bin/bash
# Run all SwissKnife tests with the fixed configuration
npx jest --config=jest-fixed-all.config.cjs "$@"
EOF
  chmod +x run-all-tests.sh
  
  echo -e "\nCreated run-all-tests.sh script to run tests with the fixed configuration."
  echo -e "Run it with: ${YELLOW}./run-all-tests.sh${NC}"
else
  echo -e "\n${RED}❌ Jest environment fix failed. Please check the errors above.${NC}"
fi
