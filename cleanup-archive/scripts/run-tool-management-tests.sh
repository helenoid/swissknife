#!/bin/bash

# Tool Registration Test Runner
# This script runs a focused test on the BaseAIAgent's tool registration capabilities

echo "🔍 Running BaseAIAgent Tool Management Tests"
echo "==========================================="

# Set NODE_PATH to include src directory for better module resolution
export NODE_PATH=$NODE_PATH:$PWD/src

# Set NODE_OPTIONS to increase memory limit if needed
export NODE_OPTIONS="--max-old-space-size=4096"

# Display configuration
echo "🔧 Testing Configuration:"
echo "  • Test File: test/unit/ai/agent/base-agent-tools.test.js"
echo "  • Config: jest.hybrid.config.cjs"

# Run Jest with an explicit test path
npx jest --config jest.hybrid.config.cjs test/unit/ai/agent/base-agent-tools.test.js --verbose

# Check exit code
TEST_EXIT_CODE=$?

# Display results
echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ BaseAIAgent Tool Management Tests: PASSED"
else
  echo "❌ BaseAIAgent Tool Management Tests: FAILED (Exit code: $TEST_EXIT_CODE)"
  
  # Provide helpful diagnostic information
  echo ""
  echo "📋 Diagnostic Information:"
  echo "  • Verify that the mock implementation is working correctly"
  echo "  • Check if the test is correctly isolating the tool registration functionality"
  echo "  • Ensure the test environment is properly configured"
fi

echo ""
echo "📊 Test Summary:"
echo "  Tool Management test completed with exit code: $TEST_EXIT_CODE"

exit $TEST_EXIT_CODE
