#!/bin/bash
# Module resolution fix script for SwissKnife test suite

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

echo -e "${BLUE}SwissKnife Test Module Resolution Fixer${RESET}"
echo "==========================================="

# Fix .js extension issue in TypeScript imports
echo -e "\n${YELLOW}Step 1: Fixing .js extension issues in source files...${RESET}"

# Find all TypeScript files with multiple .js extensions and fix them
echo "Finding and fixing files with multiple .js extensions..."
grep -l "\.js\.js" $(find src -name "*.ts") | while read file; do
  echo -e "${YELLOW}Fixing: $file${RESET}"
  # Replace multiple .js extensions with single .js
  sed -i -E 's/\.js\.js+/.js/g' "$file"
  echo -e "${GREEN}✓ Fixed $file${RESET}"
done

# Update Jest config to handle .js extensions properly
echo -e "\n${YELLOW}Step 2: Updating Jest configuration...${RESET}"
cat > jest-fixed.config.cjs << 'EOC'
/** @type {import('jest').Config} */
module.exports = {
  haste: {
    enableSymlinks: false
  },

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
        useESM: true,
        isolatedModules: true
      },
    ],
    "^.+\\.jsx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", {
            targets: { node: "current" },
            modules: 'commonjs'
          }],
          "@babel/preset-react"
        ],
        plugins: [
          "@babel/plugin-transform-class-properties",
          "@babel/plugin-transform-runtime"
        ]
      },
    ],
  },

  transformIgnorePatterns: [
    "/node_modules/(?!(lodash-es|@modelcontextprotocol|ink-.*)/)"
  ],

  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  moduleDirectories: ["node_modules", "<rootDir>/src"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^lodash-es$": "<rootDir>/node_modules/lodash",
    "^lodash-es/(.*)$": "<rootDir>/node_modules/lodash/$1",
    "^nanoid$": "<rootDir>/test/mocks/stubs/nanoid-stub.js",
    "^@modelcontextprotocol/sdk$": "<rootDir>/test/mocks/stubs/mcp-sdk-stub.js",
    "ink-testing-library": "<rootDir>/test/mocks/stubs/ink-testing-stub.js",
    
    // Handle .js extensions in imports
    "^(\\./[^.]*)\\.js$": "$1",
    "^(\\.\\./[^.]*)\\.js$": "$1",
    "^(\\.\\./\\.\\./[^.]*)\\.js$": "$1",
    "^(\\.\\./\\.\\./\\.\\./[^.]*)\\.js$": "$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/(.*)\\.js$": "<rootDir>/src/$1"
  },

  testEnvironment: "node",
  setupFilesAfterEnv: ['<rootDir>/test/setup-jest.js'],
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  testMatch: ["<rootDir>/test/**/*.test.{js,jsx,ts,tsx}"],
  testTimeout: 60000,
}
EOC

echo -e "${GREEN}✓ Created updated Jest configuration: jest-fixed.config.cjs${RESET}"

# Run a specific test to validate the configuration
echo -e "\n${YELLOW}Step 3: Testing module resolution with the fixed configuration...${RESET}"
echo "Testing AI service test..."

npx jest test/unit/ai/service.test.ts --config=jest-fixed.config.cjs --no-cache --verbose > module-resolution-test.log 2>&1

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Test passed with fixed configuration!${RESET}"
else 
  echo -e "${RED}✗ Test failed, checking error details...${RESET}"
  
  # Extract key error information
  ERROR_TYPE=$(grep -o "Cannot find module.*" module-resolution-test.log | head -1)
  if [[ -n "$ERROR_TYPE" ]]; then
    echo -e "${RED}Error: $ERROR_TYPE${RESET}"
    echo "This suggests we need to fix the module mapping for this import."
  fi
  
  # Check if it's a duplicate module error
  DUPLICATE=$(grep -o "Haste module naming collision.*" module-resolution-test.log | head -1)
  if [[ -n "$DUPLICATE" ]]; then
    echo -e "${RED}Error: Duplicate module found.${RESET}"
    echo "This suggests we need to fix duplicate package.json files."
    DUPLICATE_FILES=$(grep -A 2 "The following files share their name" module-resolution-test.log | tail -2)
    echo -e "${YELLOW}Duplicate files:${RESET}"
    echo "$DUPLICATE_FILES"
  fi
  
  # Check for syntax errors
  SYNTAX=$(grep -A 3 "SyntaxError:" module-resolution-test.log | head -4)
  if [[ -n "$SYNTAX" ]]; then
    echo -e "${RED}Syntax error detected:${RESET}"
    echo "$SYNTAX"
  fi
  
  echo -e "${YELLOW}See full details in module-resolution-test.log${RESET}"
fi

echo -e "\n${BLUE}Next steps:${RESET}"
echo "1. Run tests with the fixed configuration: npx jest --config=jest-fixed.config.cjs"
echo "2. Fix any remaining module resolution issues in specific files"
echo "3. Address duplicate package.json files if indicated in errors"
echo ""
echo -e "${GREEN}Module resolution fixing script complete!${RESET}"
