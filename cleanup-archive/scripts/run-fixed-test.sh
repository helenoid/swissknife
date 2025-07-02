#!/bin/bash
# Run a specific test with the fixed configuration

TEST_PATH=$1

if [ -z "$TEST_PATH" ]; then
  echo "Usage: ./run-fixed-test.sh <test-path>"
  echo "Example: ./run-fixed-test.sh test/unit/models/execution/execution-service.test.ts"
  exit 1
fi

echo "Running test: $TEST_PATH"
npx jest --config=jest-fix-cjs.config.cjs $TEST_PATH
