#!/bin/bash
# simple-test-diagnostic.sh
# Simple test to isolate Jest hanging issues

echo "=== Simple Test Diagnostic ==="
echo "Current directory: $(pwd)"

# Try basic Node.js execution first
echo "=== Testing Node.js ==="
node -e "console.log('Node.js is working')" || echo "Node.js failed"

# Try basic NPX execution
echo "=== Testing NPX ==="
npx --version || echo "NPX failed"

# Try Jest version check
echo "=== Testing Jest version ==="
timeout 10s npx jest --version || echo "Jest version check failed or timed out"

# Test simplest possible Jest run
echo "=== Creating minimal test ==="
cat > simple-diagnostic.test.js << 'EOF'
describe('Basic diagnostic', () => {
  test('should pass', () => {
    expect(1 + 1).toBe(2);
  });
});
EOF

echo "=== Running minimal test with timeout ==="
timeout 30s npx jest simple-diagnostic.test.js --no-watchman --runInBand --verbose || echo "Minimal test failed or timed out"

# Clean up
rm -f simple-diagnostic.test.js

echo "=== Diagnostic complete ==="
