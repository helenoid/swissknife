#!/bin/bash

# Test Runner Script for BaseAIAgent Tests
# This script is part of the SwissKnife test infrastructure

echo "🔍 Running BaseAIAgent Tests"
echo "=============================="

# Set NODE_PATH to include src directory for better module resolution
export NODE_PATH=$NODE_PATH:$PWD/src

# Set NODE_OPTIONS to increase memory limit if needed
export NODE_OPTIONS="--max-old-space-size=4096"

# Display configuration
echo "🔧 Testing Configuration:"
echo "  • Test File: test/unit/ai/agent/base-agent.test.js"
echo "  • Config: jest-baseagent.config.js"

# Run Jest with specific config for BaseAIAgent tests
NODE_OPTIONS="--experimental-vm-modules" npx jest --config jest-baseagent.config.js --verbose

# Check exit code
TEST_EXIT_CODE=$?

# Display results
echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ BaseAIAgent Tests: PASSED"
else
  echo "❌ BaseAIAgent Tests: FAILED (Exit code: $TEST_EXIT_CODE)"
  
  # Offer diagnostic information for common failures
  echo ""
  echo "📋 Diagnostic Information:"
  echo "  • Check for mock dependencies in BaseAIAgent test file"
  echo "  • Ensure all import paths are correct in the test file"
  echo "  • Verify test assertions match the expected behavior"
  echo "  • Check for TypeScript vs JavaScript compatibility issues"
fi

echo ""
echo "📊 Test Summary:"
echo "  BaseAIAgent test completed with exit code: $TEST_EXIT_CODE"

exit $TEST_EXIT_CODE
