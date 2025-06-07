#!/bin/bash

# Focused BaseAIAgent Test Runner
# This script runs a minimal test focused on tool registration functionality

echo "🔍 Running Focused BaseAIAgent Test"
echo "=================================="

# Set NODE_OPTIONS to increase memory limit if needed
export NODE_OPTIONS="--max-old-space-size=4096"

# Display configuration
echo "🔧 Testing Configuration:"
echo "  • Test File: test/unit/ai/agent/focused-agent-test.js"
echo "  • Config: jest.focused.config.cjs"
echo ""

# Run the focused test
npx jest --config jest.focused.config.cjs --verbose

# Check exit code
TEST_EXIT_CODE=$?

# Display results
echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ Focused BaseAIAgent Test: PASSED"
else
  echo "❌ Focused BaseAIAgent Test: FAILED (Exit code: $TEST_EXIT_CODE)"
  
  # Provide helpful information if tests fail
  echo ""
  echo "📋 Diagnostic Information:"
  echo "  • The test is completely isolated and mocked"
  echo "  • Check Jest configuration for proper module handling"
  echo "  • Verify that @jest/globals is properly installed"
  echo "  • Run with '--no-cache' if needed: npx jest --no-cache --config jest.focused.config.cjs"
fi

echo ""
echo "📊 Test Summary:"
echo "  BaseAIAgent core functionality test completed with exit code: $TEST_EXIT_CODE"

exit $TEST_EXIT_CODE
