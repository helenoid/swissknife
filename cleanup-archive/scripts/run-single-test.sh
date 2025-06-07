#!/bin/bash
# Simple runner for a single test file

TEST_FILE="$1"

# Check if file exists
if [ ! -f "$TEST_FILE" ]; then
  echo "Error: Test file $TEST_FILE not found"
  exit 1
fi

echo "Running test: $TEST_FILE"
npx jest "$TEST_FILE" --verbose
