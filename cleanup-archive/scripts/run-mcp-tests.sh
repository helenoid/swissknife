#!/bin/bash
# Comprehensive MCP test runner with diagnostic information

# Set up colors
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
RESET="\033[0m"

# Create a results directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="./test_results_$TIMESTAMP"
mkdir -p "$RESULTS_DIR"

echo -e "${BLUE}SwissKnife Test Runner${RESET}"
echo "===================================="
echo "Results will be saved to: $RESULTS_DIR"

# Step 1: Run the fixed MCP test
echo -e "\n${BLUE}Step 1: Running fixed MCP deployment manager test${RESET}"
FIXED_TEST="./test/unit/services/mcp/mcp-deployment-manager.fixed.ts"
FIXED_CONFIG="./jest-mcp.config.js"

npx jest "$FIXED_TEST" --config="$FIXED_CONFIG" > "$RESULTS_DIR/fixed-test.log" 2>&1
FIXED_EXIT_CODE=$?

if [ $FIXED_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Fixed test passed!${RESET}"
else
  echo -e "${RED}❌ Fixed test failed.${RESET}"
  echo -e "${YELLOW}Checking error log...${RESET}"
  grep -A 3 "Error:" "$RESULTS_DIR/fixed-test.log" || echo "No specific error found"
fi

# Step 2: Run the simplified test
echo -e "\n${BLUE}Step 2: Running simplified MCP test${RESET}"
SIMPLIFIED_TEST="./test/mcp-deployment-simplified.test.js"

npx jest "$SIMPLIFIED_TEST" --config="$FIXED_CONFIG" > "$RESULTS_DIR/simplified-test.log" 2>&1
SIMPLIFIED_EXIT_CODE=$?

if [ $SIMPLIFIED_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Simplified test passed!${RESET}"
else
  echo -e "${RED}❌ Simplified test failed.${RESET}"
  echo -e "${YELLOW}Checking error log...${RESET}"
  grep -A 3 "Error:" "$RESULTS_DIR/simplified-test.log" || echo "No specific error found"
fi

# Step 3: Generate improved test config
echo -e "\n${BLUE}Step 3: Creating improved test configuration${RESET}"
cat > "$RESULTS_DIR/improved-jest.config.js" << 'EOL'
/**
 * Improved Jest configuration for ESM compatibility
 */
module.exports = {
  testEnvironment: 'node',
  
  // Transform TS and JS files
  transform: {
    '^.+\\.(ts|js)x?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ],
      plugins: ['@babel/plugin-transform-modules-commonjs']
    }]
  },
  
  // Map .js extensions to support ESM imports
  moduleNameMapper: {
    '^(.*)\\.js$': '$1'
  },
  
  // Support for ESM modules
  extensionsToTreatAsEsm: ['.ts', '.js'],
  
  // Avoid Haste module naming collisions
  haste: {
    disableModuleIdExtension: true,
    providesModuleNodeModules: []
  },
  
  // Increase timeout for slow tests
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
};
EOL

# Step 4: Run the original test with improved config
echo -e "\n${BLUE}Step 4: Running original test with improved config${RESET}"
ORIGINAL_TEST="./test/unit/services/mcp/mcp-deployment-manager.test.ts"

npx jest "$ORIGINAL_TEST" --config="$RESULTS_DIR/improved-jest.config.js" > "$RESULTS_DIR/improved-config-test.log" 2>&1
IMPROVED_EXIT_CODE=$?

if [ $IMPROVED_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Test with improved config passed!${RESET}"
else
  echo -e "${RED}❌ Test with improved config failed.${RESET}"
  echo -e "${YELLOW}Checking error log...${RESET}"
  grep -A 3 "Error:" "$RESULTS_DIR/improved-config-test.log" || echo "No specific error found"
fi

# Step 5: Fix the original test file based on the fixed version
echo -e "\n${BLUE}Step 5: Applying fixes to original test file${RESET}"

if [ -f "$FIXED_TEST" ]; then
  # Create a backup of the original test
  cp "$ORIGINAL_TEST" "$RESULTS_DIR/original-test-backup.ts"
  
  # Apply common fixes
  echo -e "${YELLOW}Fixing mock implementation...${RESET}"
  sed -i 's/mockReturnThis/mockReturnThis()/g' "$ORIGINAL_TEST"
  
  # Fix import paths
  echo -e "${YELLOW}Ensuring .js extensions on imports...${RESET}"
  sed -i '/import.*from/ s/\(from.*['"'"'"]\).*\/\(.*\)['"'"'"]/\1..\/..\/..\/..\/src\/\2.js\"/g' "$ORIGINAL_TEST"

  # Fix mock implementations
  echo -e "${YELLOW}Fixing mock implementations...${RESET}"
  sed -i 's/getInstance: jest.fn().mockReturnThis/getInstance: jest.fn().mockReturnThis()/g' "$ORIGINAL_TEST"
  
  echo -e "${GREEN}Fixes applied to original test file${RESET}"
  
  # Run the fixed original test
  echo -e "\n${BLUE}Running fixed original test...${RESET}"
  npx jest "$ORIGINAL_TEST" --config="$RESULTS_DIR/improved-jest.config.js" > "$RESULTS_DIR/fixed-original-test.log" 2>&1
  FIXED_ORIGINAL_EXIT_CODE=$?
  
  if [ $FIXED_ORIGINAL_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Fixed original test passed!${RESET}"
  else
    echo -e "${RED}❌ Fixed original test failed.${RESET}"
    echo -e "${YELLOW}Checking error log...${RESET}"
    grep -A 3 "Error:" "$RESULTS_DIR/fixed-original-test.log" || echo "No specific error found"
  fi
else
  echo -e "${RED}Fixed test file not found: $FIXED_TEST${RESET}"
fi

# Step 6: Generate a diagnostic report
echo -e "\n${BLUE}Step 6: Generating diagnostic report${RESET}"
REPORT="$RESULTS_DIR/diagnostic_report.md"

cat > "$REPORT" << EOL
# SwissKnife Test Diagnostic Report
Generated: $(date)

## Test Results

| Test | Config | Result |
|------|--------|--------|
| Fixed MCP Test | jest-mcp.config.js | $([ $FIXED_EXIT_CODE -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL") |
| Simplified MCP Test | jest-mcp.config.js | $([ $SIMPLIFIED_EXIT_CODE -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL") |
| Original Test with Improved Config | improved-jest.config.js | $([ $IMPROVED_EXIT_CODE -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL") |
| Fixed Original Test | improved-jest.config.js | $([ -v FIXED_ORIGINAL_EXIT_CODE ] && ([ $FIXED_ORIGINAL_EXIT_CODE -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL") || echo "⚠️ Not Run") |

## Common Issues and Fixes

### 1. ESM Import Compatibility
- **Issue**: ESM modules require file extensions (.js) in import paths
- **Fix**: Ensure all imports from src include the .js extension

### 2. Mock Implementation
- **Issue**: Incorrect mock implementation syntax
- **Fix**: Change \`mockReturnThis\` to \`mockReturnThis()\`

### 3. Jest Configuration
- **Issue**: Conflicts between ESM and CommonJS
- **Fix**: Use Babel to transform modules and set up proper moduleNameMapper

### 4. Module Resolution
- **Issue**: Path resolution issues between test and src directories
- **Fix**: Configure moduleNameMapper to handle .js extensions properly

## Next Steps

1. Apply the fixes from the fixed test to all test files
2. Use the improved Jest configuration for all tests
3. Update package.json scripts to use the improved configuration
4. Consider adding ESLint rules to enforce proper import paths

EOL

echo -e "${GREEN}Diagnostic report generated: $REPORT${RESET}"
echo -e "\n${BLUE}Test Run Complete!${RESET}"
