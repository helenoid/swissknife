#!/bin/bash
# Jest Test Diagnostic Tool
# Provides comprehensive information about test environment and execution

# Environment information
echo "===== ENVIRONMENT INFO ====="
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"
echo "Current directory: $(pwd)"

# Jest configuration check
echo "===== JEST CONFIG CHECK ====="
echo "Looking for Jest configurations..."
find . -name "jest*.config.*" | sort

# Run minimal test with verbose logging
echo "===== RUNNING MINIMAL TEST ====="
JEST_DEBUG=true NODE_OPTIONS="--trace-warnings" npx jest --no-cache --verbose test/comprehensive-diagnostic.test.js

echo "===== ADDITIONAL TESTS ====="
echo "Testing module resolution..."

# Create a temporary test file for module resolution
TMP_TEST_FILE="./tmp-module-test.js"

cat > $TMP_TEST_FILE << EOL
/**
 * Module resolution test
 */
const path = require('path');

test('Path module loads correctly', () => {
  console.log('path module type:', typeof path);
  console.log('path.join function:', typeof path.join);
  expect(path.join('a', 'b')).toBe('a/b');
});

try {
  // Try loading a project module
  const fs = require('fs');
  test('Can read package.json', () => {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    console.log('Package name:', pkg.name);
    expect(pkg.name).toBeDefined();
  });
} catch (err) {
  test('Module loading error captured', () => {
    console.error('Error loading module:', err);
    expect(err).toBeDefined();
  });
}
EOL

echo "Running temporary module test..."
npx jest --no-cache $TMP_TEST_FILE --verbose

# Clean up
rm $TMP_TEST_FILE

echo "===== DIAGNOSTIC COMPLETE ====="
