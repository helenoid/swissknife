#!/bin/bash

# Verify if the test fixes are working
echo "============================================"
echo "SwissKnife Test Fix Verification"
echo "============================================"

# Run a simple test with fixed configuration
npx jest --config=jest-fixed.config.cjs test/unit/utils/logging/simple-manager.test.js
# Check self-contained test
npx jest --config=jest-fixed.config.cjs test/unit/utils/errors/self-contained.test.js
# Check TypeScript test
npx jest --config=jest-fixed.config.cjs test/unit/utils/cache/manager.test.ts

echo "============================================"
echo "Verification completed!"
echo "============================================"
