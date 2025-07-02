#!/bin/bash

# Simple test verification script
echo "=== Test Environment Verification ==="
echo "Current directory: $(pwd)"
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

echo -e "\n=== Checking package.json ==="
if [ -f "package.json" ]; then
    echo "✓ package.json exists"
    echo "Package name: $(node -p "require('./package.json').name")"
else
    echo "✗ package.json not found"
fi

echo -e "\n=== Checking Jest installation ==="
if [ -f "node_modules/.bin/jest" ]; then
    echo "✓ Jest binary exists"
    echo "Jest version: $(./node_modules/.bin/jest --version)"
else
    echo "✗ Jest binary not found"
    echo "Available binaries in node_modules/.bin/:"
    ls node_modules/.bin/ | head -10
fi

echo -e "\n=== Checking Jest config ==="
if [ -f "jest.unified.config.cjs" ]; then
    echo "✓ jest.unified.config.cjs exists"
else
    echo "✗ jest.unified.config.cjs not found"
fi

echo -e "\n=== Checking test files ==="
echo "Test files count: $(find test -name "*.test.js" | wc -l)"
echo "First few test files:"
find test -name "*.test.js" | head -5

echo -e "\n=== Attempting simple Jest run ==="
if command -v npx >/dev/null 2>&1; then
    echo "Using npx to run Jest..."
    npx jest --version || echo "npx jest failed"
else
    echo "npx not available"
fi
