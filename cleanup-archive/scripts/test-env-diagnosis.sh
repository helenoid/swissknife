#!/bin/bash
# SwissKnife Test Environment Diagnosis
# Created: May 14, 2025

echo "SwissKnife Test Environment Diagnosis"
echo "===================================="
echo ""

# Create diagnostic directory
DIAG_DIR="test-diagnostics-$(date +%Y%m%d_%H%M%S)"
mkdir -p $DIAG_DIR

# Check Node.js and npm versions
echo "### Node.js Environment ###"
echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"

# Check package.json type field
echo -e "\n### Package Configuration ###"
TYPE=$(node -e "try { console.log(require('./package.json').type || 'commonjs (default)') } catch(e) { console.log('Error reading package.json') }")
echo "Module type: $TYPE"

# Create a dual-mode test file
echo -e "\n### Creating dual-mode test files ###"
DUAL_TEST_DIR="$DIAG_DIR/dual-mode"
mkdir -p $DUAL_TEST_DIR

# Create CJS test file
cat > "$DUAL_TEST_DIR/test.cjs" << 'EOF'
// CommonJS test file
const { describe, test, expect } = require('@jest/globals');

describe('CommonJS Test', () => {
  test('It works', () => {
    expect(1 + 1).toBe(2);
  });
});
EOF

# Create ESM test file
cat > "$DUAL_TEST_DIR/test.mjs" << 'EOF'
// ESM test file
import { describe, test, expect } from '@jest/globals';

describe('ESM Test', () => {
  test('It works', () => {
    expect(1 + 1).toBe(2);
  });
});
EOF

# Create CommonJS Jest config
cat > "$DUAL_TEST_DIR/jest.cjs.config.cjs" << 'EOF'
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.c?js$": ["babel-jest", {
      presets: [['@babel/preset-env', {targets: {node: 'current'}}]]
    }]
  },
  testMatch: ["**/*.cjs"]
};
EOF

# Create ESM Jest config
cat > "$DUAL_TEST_DIR/jest.esm.config.cjs" << 'EOF'
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    "^.+\\.mjs$": ["babel-jest", {
      presets: [['@babel/preset-env', {targets: {node: 'current'}}]]
    }]
  },
  extensionsToTreatAsEsm: ['.mjs'],
  testMatch: ["**/*.mjs"]
};
EOF

# Create a package.json with type: module for the ESM directory
cat > "$DUAL_TEST_DIR/package.json" << 'EOF'
{
  "type": "module"
}
EOF

# Try running the CommonJS test
echo -e "\n### Testing CommonJS mode ###"
COMMONJS_RESULT=$(cd $DUAL_TEST_DIR && npx jest --config=jest.cjs.config.cjs 2>&1)
COMMONJS_EXIT=$?

if [ $COMMONJS_EXIT -eq 0 ]; then
  echo "✅ CommonJS tests: PASS"
else
  echo "❌ CommonJS tests: FAIL"
  echo "$COMMONJS_RESULT" | head -n 20
fi

# Try running the ESM test
echo -e "\n### Testing ESM mode ###"
ESM_RESULT=$(cd $DUAL_TEST_DIR && NODE_OPTIONS="--experimental-vm-modules" npx jest --config=jest.esm.config.cjs 2>&1)
ESM_EXIT=$?

if [ $ESM_EXIT -eq 0 ]; then
  echo "✅ ESM tests: PASS"
else
  echo "❌ ESM tests: FAIL"
  echo "$ESM_RESULT" | head -n 20
fi

# Create a report
REPORT="$DIAG_DIR/report.md"
cat > "$REPORT" << EOF
# SwissKnife Test Environment Report
Generated: $(date)

## Environment
- Node.js: $(node -v)
- npm: $(npm -v)
- Package type: $TYPE

## CommonJS Test Results
\`\`\`
$COMMONJS_RESULT
\`\`\`

## ESM Test Results
\`\`\`
$ESM_RESULT
\`\`\`

## Next Steps
Based on these results, we recommend:

1. If both tests pass:
   - Create a hybrid Jest configuration that can handle both formats

2. If only CommonJS tests pass:
   - Either convert ESM files to CommonJS (add .cjs extension)
   - Or fix the ESM configuration in Jest

3. If only ESM tests pass:
   - Either convert CommonJS files to ESM (add .mjs extension)
   - Or fix the CommonJS configuration in Jest

4. If both tests fail:
   - Check the Jest installation and basic configuration
   - Verify Babel presets and plugins are correctly installed
EOF

echo -e "\nDiagnosis complete. Report saved to $REPORT"
