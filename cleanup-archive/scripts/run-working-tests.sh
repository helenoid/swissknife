#!/bin/bash
# Run tests with the working configuration

# Get test path from command line or use default
TEST_PATH=${1:-"test"}

# Use the working configuration
CONFIG_PATH="jest.config.cjs"

echo "Running tests at: $TEST_PATH"
echo "Using config: $CONFIG_PATH"
echo ""

# Run Jest with the working configuration
npx jest "$TEST_PATH" --config="$CONFIG_PATH" --verbose "$@"
