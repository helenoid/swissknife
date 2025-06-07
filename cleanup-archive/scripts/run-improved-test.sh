#!/bin/bash
# Script to run a specific test with improved configuration

TEST_PATH=$1
WATCH=${2:-false}

if [ -z "$TEST_PATH" ]; then
  echo "Usage: ./run-improved-test.sh <test-path> [watch]"
  echo "Example: ./run-improved-test.sh test/unit/models/execution/execution-service.test.ts"
  echo "To run in watch mode: ./run-improved-test.sh test/unit/models/execution/execution-service.test.ts watch"
  exit 1
fi

if [ "$WATCH" = "watch" ]; then
  echo "Running test in watch mode: $TEST_PATH"
  npx jest --config=jest-improved.config.cjs $TEST_PATH --watch
else
  echo "Running test: $TEST_PATH"
  npx jest --config=jest-improved.config.cjs $TEST_PATH
fi
