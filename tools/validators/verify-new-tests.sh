#!/bin/bash

# Test Verification Script
# Verify our new fixed tests work correctly

cd /home/barberb/swissknife

echo "=== SwissKnife Test Verification ==="
echo "Testing our newly created fixed test files..."
echo ""

# Test 1: Execution Service Fixed Test
echo "🧪 Testing Execution Service Fixed Test..."
npx jest test/unit/models/execution-service-fixed.test.ts --verbose --no-cache --testTimeout=10000 2>&1 | head -30

echo ""
echo "🧪 Testing Help Generator Fixed Test..."
npx jest test/unit/commands/help-generator-fixed.test.ts --verbose --no-cache --testTimeout=10000 2>&1 | head -30

echo ""
echo "🧪 Testing Command Parser Fixed Test..."  
npx jest test/unit/commands/command-parser-fixed.test.ts --verbose --no-cache --testTimeout=10000 2>&1 | head -30

echo ""
echo "=== Test Verification Complete ==="
