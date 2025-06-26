#!/bin/bash

echo "=== Jest Test Diagnostic ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo ""

echo "=== Checking Jest installation ==="
npm list jest
echo ""

echo "=== Testing basic Jest functionality ==="
cd /home/barberb/swissknife
npx jest --version
echo ""

echo "=== Running Jest with minimal config ==="
npx jest --config=jest.working.config.cjs --listTests | head -10
echo ""

echo "=== Running single test with debug ==="
npx jest --config=jest.working.config.cjs --testPathPattern="simple-basic.test.ts" --detectOpenHandles --forceExit --maxWorkers=1