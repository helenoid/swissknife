#!/bin/bash
# Run tests with fixed configuration

echo "🧪 Running SwissKnife tests with fixed configuration"
echo "=================================================="

# Set environment
export NODE_ENV=test
export DEBUG_TESTS=${DEBUG_TESTS:-false}

# Use the working Jest configuration
CONFIG="jest-working.config.js"

if [ "$1" = "--debug" ]; then
    export DEBUG_TESTS=true
    shift
fi

# Run Jest with the working configuration
echo "Using configuration: $CONFIG"
echo "Test path: ${1:-test}"
echo ""

npx jest --config="$CONFIG" "${1:-test}" "${@:2}"
