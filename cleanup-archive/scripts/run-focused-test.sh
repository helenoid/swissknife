#!/bin/bash

# Focused BaseAIAgent Test Runner
# This script runs the focused tests for BaseAIAgent tool functionality

echo "🔍 Running Focused BaseAIAgent Tests"
echo "=================================="

# Set NODE_PATH to include src directory for better module resolution
export NODE_PATH=$NODE_PATH:$PWD/src

# Display configuration
echo "🔧 Testing Configuration:"
echo "  • Test File: test/unit/ai/agent/focused-agent-test.js"
echo "  • Config: jest.focused.config.cjs"

# Run Jest with the focused config
npx jest --config jest.focused.config.cjs --verbose

# Check exit code
TEST_EXIT_CODE=$?

# Display results
echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ Focused BaseAIAgent Tests: PASSED"
else
  echo "❌ Focused BaseAIAgent Tests: FAILED (Exit code: $TEST_EXIT_CODE)"
  
  # Provide diagnostic information
  echo ""
  echo "📋 Diagnostic Information:"
  echo "  • Check that the mock BaseAIAgent implementation matches the expected interface"
  echo "  • Ensure Jest is configured correctly in jest.focused.config.cjs"
  echo "  • Verify that module paths are correct in the test file"
fi

echo ""
echo "📊 Test Summary:"
echo "  Focused BaseAIAgent test completed with exit code: $TEST_EXIT_CODE"

exit $TEST_EXIT_CODE
